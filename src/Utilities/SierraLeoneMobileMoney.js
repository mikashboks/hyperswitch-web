export const MOBILE_MONEY_SUBTYPES = ['orange_money', 'afrimoney'];

export const MOBILE_MONEY_OPERATORS = [
  {
    id: 'orange_money',
    label: 'Orange Money',
    shortCode: 'OM',
    accentColor: '#FF7900',
    accentTint: 'rgba(255, 121, 0, 0.12)',
    badgeTextColor: '#111827',
    pinName: 'Orange Money PIN',
    approvalHint:
      'Next, follow the Orange Money dial code or prompt shown and confirm with your Orange Money PIN — never enter your Orange Money PIN on this page.',
    prefixes: ['71', '72', '73', '74', '75', '76', '78', '79'],
  },
  {
    id: 'afrimoney',
    label: 'AfriMoney',
    shortCode: 'AM',
    accentColor: '#A61C3C',
    accentTint: 'rgba(166, 28, 60, 0.12)',
    badgeTextColor: '#FFFFFF',
    pinName: 'AfriMoney PIN',
    approvalHint:
      'Next, approve the AfriMoney prompt on your phone (or follow the dial instructions shown) with your AfriMoney PIN — never enter your AfriMoney PIN on this page.',
    prefixes: ['30', '33', '70', '77', '80', '88', '90', '99'],
  },
];

const OTHER_SIERRA_LEONE_OPERATORS = [
  {
    id: 'qmoney',
    label: 'QMoney',
    prefixes: ['31', '32', '34'],
  },
];

const ALL_SIERRA_LEONE_OPERATORS = [
  ...MOBILE_MONEY_OPERATORS,
  ...OTHER_SIERRA_LEONE_OPERATORS,
];

export function isMobileMoneySubtype(subtype) {
  return MOBILE_MONEY_SUBTYPES.includes(subtype);
}

export function enabledOperatorsFromSubtypes(subtypes) {
  const enabledSet = new Set(Array.isArray(subtypes) ? subtypes : []);
  return MOBILE_MONEY_OPERATORS.filter((operator) => enabledSet.has(operator.id));
}

export function normalizeLocalSierraLeoneDigits(rawInput) {
  let digits = String(rawInput || '').replace(/\D/g, '');
  if (digits.startsWith('00232') && digits.length > 5) {
    digits = digits.slice(5);
  } else if (digits.startsWith('232') && digits.length > 8) {
    digits = digits.slice(3);
  }
  if (digits.startsWith('0') && digits.length > 1) {
    digits = digits.slice(1);
  }
  return digits;
}

export function detectOperatorForDigits(rawInput) {
  const local = normalizeLocalSierraLeoneDigits(rawInput);
  if (local.length < 2) return null;
  const prefix = local.slice(0, 2);
  const matched = MOBILE_MONEY_OPERATORS.find((operator) => operator.prefixes.includes(prefix));
  return matched ? matched.id : null;
}

export function detectKnownSierraLeoneOperator(rawInput) {
  const local = normalizeLocalSierraLeoneDigits(rawInput);
  if (local.length < 2) return null;
  const prefix = local.slice(0, 2);
  return ALL_SIERRA_LEONE_OPERATORS.find((operator) => operator.prefixes.includes(prefix)) || null;
}

export function resolveSelectedOperator({
  enabledSubtypes,
  currentSelected,
  manualOverride,
  rawPhone,
}) {
  const operators = enabledOperatorsFromSubtypes(enabledSubtypes);
  if (operators.length === 0) return '';
  const enabledIds = operators.map((op) => op.id);
  const detected = detectOperatorForDigits(rawPhone);
  if (!manualOverride && detected && enabledIds.includes(detected)) {
    return detected;
  }
  if (currentSelected && enabledIds.includes(currentSelected)) {
    return currentSelected;
  }
  return operators[0].id;
}

export function isValidSierraLeoneMobileNumber(rawInput) {
  const local = normalizeLocalSierraLeoneDigits(rawInput);
  return /^[2-9]\d{7}$/.test(local);
}

export function getOperatorMismatchError(selectedOperator, rawPhone, enabledSubtypes = MOBILE_MONEY_SUBTYPES) {
  const local = normalizeLocalSierraLeoneDigits(rawPhone);
  if (local.length < 2 || !selectedOperator) return '';
  const detectedMeta = detectKnownSierraLeoneOperator(local);
  if (!detectedMeta || detectedMeta.id === selectedOperator) return '';
  const selectedMeta = MOBILE_MONEY_OPERATORS.find((op) => op.id === selectedOperator);
  if (!selectedMeta) return '';
  const prefix = local.slice(0, 2);
  const enabledSet = new Set(Array.isArray(enabledSubtypes) ? enabledSubtypes : []);
  if (enabledSet.has(detectedMeta.id)) {
    return `0${prefix} numbers are on ${detectedMeta.label}. Switch to ${detectedMeta.label} or enter a ${selectedMeta.label} number.`;
  }
  return `0${prefix} numbers are on ${detectedMeta.label}, which is not available here. Enter a ${selectedMeta.label} number.`;
}

export function getOperatorMetadata(operatorId) {
  return (
    MOBILE_MONEY_OPERATORS.find((op) => op.id === operatorId) || MOBILE_MONEY_OPERATORS[0]
  );
}
