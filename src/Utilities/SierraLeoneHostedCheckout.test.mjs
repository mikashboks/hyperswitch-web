import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  confirmBody,
  methodListResponse,
  configResponse,
} from './HostedV2Transport.js';
import {
  detectOperatorForDigits,
  enabledOperatorsFromSubtypes,
  getOperatorMetadata,
  getOperatorMismatchError,
  isMobileMoneySubtype,
  isValidSierraLeoneMobileNumber,
  normalizeLocalSierraLeoneDigits,
  resolveSelectedOperator,
} from './SierraLeoneMobileMoney.js';

test('Sierra Leone mobile money prefix detection and strict 8-digit validation match Rust connectors', () => {
  for (const orange of [
    '071123456',
    '+23271123456',
    '076123456',
    '76123456',
    '+23278987654',
    '0023276123456',
    '00232076123456',
    '072 111 222',
    '079000111',
  ]) {
    assert.equal(detectOperatorForDigits(orange), 'orange_money', orange);
    assert.equal(isValidSierraLeoneMobileNumber(orange), true, orange);
  }
  for (const afri of [
    '077123456',
    '77123456',
    '+23230123456',
    '0023277123456',
    '088 654 321',
    '099111222',
  ]) {
    assert.equal(detectOperatorForDigits(afri), 'afrimoney', afri);
    assert.equal(isValidSierraLeoneMobileNumber(afri), true, afri);
  }
  assert.equal(normalizeLocalSierraLeoneDigits('+232 076 123-456'), '76123456');
  assert.equal(normalizeLocalSierraLeoneDigits('0023276123456'), '76123456');
  assert.equal(normalizeLocalSierraLeoneDigits('00232076123456'), '76123456');

  // Unbacked QMoney is not exposed as a supported checkout wallet subtype
  assert.equal(isMobileMoneySubtype('qmoney'), false);
  assert.equal(detectOperatorForDigits('031123456'), null);
  assert.equal(enabledOperatorsFromSubtypes(['orange_money', 'afrimoney', 'qmoney']).length, 2);

  // Short, 9-digit, 10-digit, and double-zero inputs must fail validation (never silently truncated)
  for (const invalid of ['76123', '761234567', '7612345699', '0076123456', '00232']) {
    assert.equal(isValidSierraLeoneMobileNumber(invalid), false, invalid);
  }
});

test('Sierra Leone mobile money auto-detects operator and rejects cross-network mismatches', () => {
  const enabledSubtypes = ['orange_money', 'afrimoney'];
  assert.equal(enabledOperatorsFromSubtypes(enabledSubtypes).length, 2);

  // Auto-detects AfriMoney when typing 077...
  const autoAfri = resolveSelectedOperator({
    enabledSubtypes,
    currentSelected: 'orange_money',
    manualOverride: false,
    rawPhone: '077123456',
  });
  assert.equal(autoAfri, 'afrimoney');

  // Manual pill selection shows a clear cross-network mismatch error instead of advertising MNP
  const mismatch = getOperatorMismatchError('afrimoney', '076123456', enabledSubtypes);
  assert.match(mismatch, /Orange Money/);
  assert.match(mismatch, /Switch to Orange Money/);
  assert.doesNotMatch(mismatch, /ported/i);
  assert.equal(getOperatorMismatchError('orange_money', '076123456', enabledSubtypes), '');

  // Single-operator and unavailable-network numbers explain unavailability cleanly
  const singleOpMismatch = getOperatorMismatchError('orange_money', '077123456', ['orange_money']);
  assert.match(singleOpMismatch, /AfriMoney/);
  assert.match(singleOpMismatch, /not available here/);

  const qmoneyMismatch = getOperatorMismatchError('orange_money', '031123456', enabledSubtypes);
  assert.match(qmoneyMismatch, /QMoney/);
  assert.match(qmoneyMismatch, /not available here/);
});

test('PIN guidance always qualifies provider PIN name and reflects dial/prompt flow (MKB-CLUI)', () => {
  for (const id of ['orange_money', 'afrimoney']) {
    const meta = getOperatorMetadata(id);
    assert.doesNotMatch(meta.approvalHint, /\byour PIN\b/i);
    assert.ok(meta.approvalHint.includes(meta.pinName));
    assert.match(meta.approvalHint, /dial|prompt/i);
    assert.ok(meta.accentTint && meta.accentTint.length > 0);
  }
});

test('HostedV2Transport maps MiKashBoks, Orange Money, and AfriMoney confirm payloads to V2 contract', () => {
  const mikashboksConfirm = confirmBody({
    payment_method: 'wallet',
    payment_method_type: 'mikashboks',
    payment_method_data: {
      wallet: { mikashboks_redirect: {} },
    },
    return_url: 'https://events.mikashboksapps.com/payments/return?orderId=ord_1',
  });
  assert.deepEqual(mikashboksConfirm, {
    payment_method_type: 'wallet',
    payment_method_subtype: 'mikashboks',
    payment_method_data: {
      wallet: { mikashboks_redirect: {} },
    },
    return_url: 'https://events.mikashboksapps.com/payments/return?orderId=ord_1',
  });

  const orangeConfirm = confirmBody({
    payment_method: 'wallet',
    payment_method_type: 'orange_money',
    payment_method_data: {
      wallet: { orange_money_redirect: {} },
      billing: { phone: { country_code: '+232', number: '76123456' } },
    },
    return_url: 'https://events.mikashboksapps.com/payments/return?orderId=ord_1',
  });
  assert.deepEqual(orangeConfirm.payment_method_type, 'wallet');
  assert.deepEqual(orangeConfirm.payment_method_subtype, 'orange_money');
  assert.deepEqual(orangeConfirm.payment_method_data.billing.phone, {
    country_code: '+232',
    number: '76123456',
  });

  const afriConfirm = confirmBody({
    payment_method: 'wallet',
    payment_method_type: 'afrimoney',
    payment_method_data: {
      wallet: { afrimoney_redirect: {} },
      billing: { phone: { country_code: '+232', number: '77123456' } },
    },
  });
  assert.equal(afriConfirm.payment_method_subtype, 'afrimoney');
  assert.deepEqual(afriConfirm.payment_method_data.wallet, { afrimoney_redirect: {} });

  const methodListPayload = {
    payment_methods_enabled: [
      { payment_method_type: 'wallet', payment_method_subtype: 'mikashboks', payment_experience: ['redirect_to_url'], required_fields: [] },
      { payment_method_type: 'wallet', payment_method_subtype: 'orange_money', payment_experience: ['redirect_to_url'], required_fields: [] },
      { payment_method_type: 'wallet', payment_method_subtype: 'afrimoney', payment_experience: ['redirect_to_url'], required_fields: [] },
    ],
  };
  const intentPayload = { id: '0a_pay_123', amount_details: { order_amount: 15000, currency: 'SLE' } };
  const mappedMethods = methodListResponse(methodListPayload, intentPayload);
  assert.deepEqual(
    mappedMethods.payment_methods_enabled.map((m) => [m.payment_method, m.payment_method_type]),
    [
      ['wallet', 'mikashboks'],
      ['wallet', 'orange_money'],
      ['wallet', 'afrimoney'],
    ],
  );
  const cfg = configResponse(methodListPayload, { profile_id: 'pro_123' });
  assert.equal(cfg.raw_configs.contexts.length, 3);
});

test('ReScript hosted checkout components keep ReScript 12, MKB-CLUI, and contract invariants', () => {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const readSrc = (rel) => fs.readFileSync(path.join(dir, '..', rel), 'utf8');

  const mobileMoney = readSrc('Payments/MobileMoneyGroup.res');
  assert.doesNotMatch(mobileMoney, /\browGap:/);
  assert.match(mobileMoney, /ariaChecked=\{isSelected \? #"true" : #"false"\}/);
  assert.match(mobileMoney, /maxLength=24/);
  assert.doesNotMatch(mobileMoney, /\buserPhoneNumber\b/);
  assert.match(mobileMoney, /emitPaymentMethodStatus/);
  assert.match(mobileMoney, /<Surcharge\b/);
  assert.match(mobileMoney, /disabled=\{options\.readOnly\}/);

  const mikashboks = readSrc('Payments/MikashboksExpressButton.res');
  assert.doesNotMatch(mikashboks, /~handleUserError=true/);
  assert.match(mikashboks, /~intentCallback=handleIntentResult/);
  assert.match(mikashboks, /isMikashboks:\s*false/);
  assert.doesNotMatch(mikashboks, /Approve in your MiKashBoks app/);

  const surchargeUtils = readSrc('Components/SurchargeUtils.res');
  assert.match(surchargeUtils, /"mikashboks"/);

  const paymentUtils = readSrc('Utilities/PaymentUtils.res');
  const paymentBody = readSrc('Utilities/PaymentBody.res');
  assert.doesNotMatch(paymentUtils, /"qmoney"/);
  assert.doesNotMatch(paymentBody, /"qmoney"/);

  const englishLocale = readSrc('LocaleStrings/EnglishLocale.res');
  assert.match(englishLocale, /orPayUsing:\s*"Or pay another way"/);
});
