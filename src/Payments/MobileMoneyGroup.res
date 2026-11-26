open JotaiAtoms
open Utils

module SierraLeoneMobileMoney = {
  type operatorMeta = {
    id: string,
    label: string,
    shortCode: string,
    accentColor: string,
    accentTint: string,
    badgeTextColor: string,
    pinName: string,
    approvalHint: string,
  }

  type resolveParams = {
    enabledSubtypes: array<string>,
    currentSelected: string,
    manualOverride: bool,
    rawPhone: string,
  }

  @module("../Utilities/SierraLeoneMobileMoney.js")
  external isMobileMoneySubtype: string => bool = "isMobileMoneySubtype"

  @module("../Utilities/SierraLeoneMobileMoney.js")
  external enabledOperatorsFromSubtypes: array<string> => array<operatorMeta> =
    "enabledOperatorsFromSubtypes"

  @module("../Utilities/SierraLeoneMobileMoney.js")
  external normalizeLocalSierraLeoneDigits: string => string = "normalizeLocalSierraLeoneDigits"

  @module("../Utilities/SierraLeoneMobileMoney.js")
  external resolveSelectedOperator: resolveParams => string = "resolveSelectedOperator"

  @module("../Utilities/SierraLeoneMobileMoney.js")
  external isValidSierraLeoneMobileNumber: string => bool = "isValidSierraLeoneMobileNumber"

  @module("../Utilities/SierraLeoneMobileMoney.js")
  external getOperatorMismatchError: (string, string, array<string>) => string =
    "getOperatorMismatchError"

  @module("../Utilities/SierraLeoneMobileMoney.js")
  external getOperatorMetadata: string => operatorMeta = "getOperatorMetadata"
}

@react.component
let make = () => {
  let {iframeId} = Jotai.useAtomValue(keys)
  let loggerState = Jotai.useAtomValue(loggerAtom)
  let {themeObj} = Jotai.useAtomValue(configAtom)
  let options = Jotai.useAtomValue(optionAtom)
  let isManualRetryEnabled = Jotai.useAtomValue(JotaiAtoms.isManualRetryEnabled)
  let intent = PaymentHelpers.usePaymentIntent(Some(loggerState), Other)
  let paymentMethodListValue = Jotai.useAtomValue(PaymentUtils.paymentMethodListValue)
  let setFieldComplete = Jotai.useSetAtom(fieldsComplete)
  let {country, state, pinCode} = PaymentUtils.useNonPiiAddressData()
  let emitter = SubscriptionEventHooks.useSubscriptionEventEmitter()

  let enabledSubtypes = React.useMemo(() => {
    let raw =
      paymentMethodListValue.payment_methods
      ->Array.filter(pm => pm.payment_method === "wallet")
      ->Array.reduce([], (acc, pm) =>
        acc->Array.concat(
          pm.payment_method_types
          ->Array.map(t => t.payment_method_type)
          ->Array.filter(SierraLeoneMobileMoney.isMobileMoneySubtype),
        )
      )
      ->removeDuplicate
    raw->Array.length > 0 ? raw : ["orange_money", "afrimoney"]
  }, [paymentMethodListValue.payment_methods])

  let operators = React.useMemo(
    () => SierraLeoneMobileMoney.enabledOperatorsFromSubtypes(enabledSubtypes),
    [enabledSubtypes],
  )

  let (rawPhone, setRawPhone) = React.useState(_ => "")
  let (manualOverride, setManualOverride) = React.useState(_ => false)
  let (selectedOperator, setSelectedOperator) = React.useState(_ =>
    enabledSubtypes->Array.get(0)->Option.getOr("orange_money")
  )
  let (touched, setTouched) = React.useState(_ => false)
  let (submitAttempted, setSubmitAttempted) = React.useState(_ => false)

  let resolvedOperator = SierraLeoneMobileMoney.resolveSelectedOperator({
    enabledSubtypes,
    currentSelected: selectedOperator,
    manualOverride,
    rawPhone,
  })

  React.useEffect(() => {
    if resolvedOperator !== "" && resolvedOperator !== selectedOperator {
      setSelectedOperator(_ => resolvedOperator)
    }
    None
  }, (resolvedOperator, selectedOperator))

  let localDigits = SierraLeoneMobileMoney.normalizeLocalSierraLeoneDigits(rawPhone)
  let isPhoneValid = SierraLeoneMobileMoney.isValidSierraLeoneMobileNumber(rawPhone)
  let mismatchError = SierraLeoneMobileMoney.getOperatorMismatchError(
    resolvedOperator,
    rawPhone,
    enabledSubtypes,
  )
  let isEmpty = localDigits === ""
  let isComplete = resolvedOperator !== "" && isPhoneValid && mismatchError === ""
  let activeMeta = SierraLeoneMobileMoney.getOperatorMetadata(resolvedOperator)

  React.useEffect(() => {
    setFieldComplete(_ => isComplete)
    None
  }, [isComplete])

  React.useEffect(() => {
    if resolvedOperator !== "" {
      PaymentUtils.emitPaymentMethodInfo(
        ~paymentMethod="wallet",
        ~paymentMethodType=resolvedOperator,
        ~country,
        ~state,
        ~pinCode,
      )
      emitter.emitPaymentMethodStatus(
        ~paymentMethod="wallet",
        ~paymentMethodType=resolvedOperator,
        ~isSavedPaymentMethod=false,
      )
    }
    None
  }, (resolvedOperator, country, state, pinCode))

  UtilityHooks.useHandlePostMessages(
    ~complete=isComplete,
    ~empty=isEmpty,
    ~paymentType=resolvedOperator !== "" ? resolvedOperator : "mobile_money",
  )
  SubscriptionEventHooks.useEmitFormStatus(~empty=isEmpty, ~complete=isComplete)

  let submitCallback = React.useCallback((ev: Window.event) => {
    let json = ev.data->safeParse
    let confirm = json->getDictFromJson->ConfirmType.itemToObjMapper
    if confirm.doSubmit && !options.readOnly {
      if isComplete {
        let body = PaymentBody.mobileMoneyPaymentBody(
          ~paymentMethodType=resolvedOperator,
          ~countryCode="+232",
          ~phoneNumber=localDigits,
        )
        intent(
          ~bodyArr=body,
          ~confirmParam=confirm.confirmParams,
          ~handleUserError=false,
          ~iframeId,
          ~manualRetry=isManualRetryEnabled,
        )
      } else {
        setTouched(_ => true)
        setSubmitAttempted(_ => true)
        let validationMessage = if isEmpty {
          "Enter your 8-digit Sierra Leone mobile money number (for example 76 123 456)."
        } else if mismatchError !== "" {
          mismatchError
        } else {
          "Enter an 8-digit Sierra Leone mobile number (for example 76 123 456)."
        }
        postFailedSubmitResponse(~errortype="validation_error", ~message=validationMessage)
      }
    }
  }, (
    isComplete,
    isEmpty,
    mismatchError,
    resolvedOperator,
    localDigits,
    options.readOnly,
    iframeId,
    isManualRetryEnabled,
    intent,
  ))

  PaymentMessageHooks.useSubmitPaymentData(submitCallback)

  let handlePhoneChange = ev => {
    if !options.readOnly {
      let nextRaw: string = ReactEvent.Form.target(ev)["value"]
      setRawPhone(_ => nextRaw)
      if nextRaw->String.trim === "" {
        setManualOverride(_ => false)
      }
    }
  }

  let showEmptyError = submitAttempted && isEmpty
  let showMismatchError = !isEmpty && mismatchError !== ""
  let showFormatError = (touched || submitAttempted) && !isEmpty && !isPhoneValid && !showMismatchError
  let showError = showEmptyError || showMismatchError || showFormatError
  let errorText = if showEmptyError {
    "Enter your 8-digit Sierra Leone mobile money number (for example 76 123 456)."
  } else if showMismatchError {
    mismatchError
  } else {
    "Enter an 8-digit Sierra Leone mobile number (for example 76 123 456)."
  }

  <div
    className="DynamicFields flex flex-col animate-slowShow pt-3"
    style={gap: "12px"}>
    <RenderIf condition={operators->Array.length > 1}>
      <div className="flex flex-col" style={gap: "6px"}>
        <div
          style={
            fontSize: "12px",
            fontWeight: "600",
            color: themeObj.colorTextSecondary,
          }>
          {React.string("Mobile network")}
        </div>
        <div role="radiogroup" ariaLabel="Mobile money network" className="flex flex-row gap-2">
          {operators
          ->Array.map(op => {
            let isSelected = op.id === resolvedOperator
            <button
              key={op.id}
              type_="button"
              role="radio"
              ariaChecked={isSelected ? #"true" : #"false"}
              disabled={options.readOnly}
              onClick={_ => {
                if !options.readOnly {
                  setManualOverride(_ => true)
                  setSelectedOperator(_ => op.id)
                }
              }}
              className="flex-1 flex flex-row items-center justify-center gap-2"
              style={
                minHeight: "42px",
                padding: "6px 10px",
                borderRadius: themeObj.borderRadius,
                border: isSelected
                  ? `2px solid ${op.accentColor}`
                  : `1px solid ${themeObj.borderColor}`,
                backgroundColor: isSelected ? op.accentTint : "transparent",
                color: themeObj.colorText,
                cursor: options.readOnly ? "not-allowed" : "pointer",
                opacity: options.readOnly ? "0.65" : "1",
              }>
              <span
                ariaHidden=true
                style={
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "24px",
                  height: "19px",
                  borderRadius: "4px",
                  backgroundColor: op.accentColor,
                  color: op.badgeTextColor,
                  fontSize: "10px",
                  fontWeight: "800",
                }>
                {React.string(op.shortCode)}
              </span>
              <span style={fontSize: "13px", fontWeight: isSelected ? "700" : "500"}>
                {React.string(op.label)}
              </span>
            </button>
          })
          ->React.array}
        </div>
      </div>
    </RenderIf>

    <div className="flex flex-col" style={gap: "6px"}>
      <label
        htmlFor="sl-mobile-money-phone"
        style={
          fontSize: "12px",
          fontWeight: "600",
          color: themeObj.colorTextSecondary,
        }>
        {React.string(`${activeMeta.label} number`)}
      </label>
      <div
        className="flex flex-row items-center overflow-hidden"
        style={
          minHeight: "46px",
          borderRadius: themeObj.borderRadius,
          border: showError
            ? `1px solid ${themeObj.colorDanger}`
            : `1px solid ${themeObj.borderColor}`,
          backgroundColor: themeObj.colorBackground,
        }>
        <span
          ariaHidden=true
          style={
            padding: "0 12px",
            fontSize: "14px",
            fontWeight: "600",
            color: themeObj.colorTextSecondary,
            borderRight: `1px solid ${themeObj.borderColor}`,
          }>
          {React.string("SL +232")}
        </span>
        <input
          id="sl-mobile-money-phone"
          type_="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="76 123 456"
          maxLength=24
          readOnly={options.readOnly}
          disabled={options.readOnly}
          value=rawPhone
          ariaLabel={`${activeMeta.label} phone number`}
          onChange=handlePhoneChange
          onBlur={_ => setTouched(_ => true)}
          style={
            flex: "1",
            width: "100%",
            height: "44px",
            padding: "0 12px",
            border: "none",
            outline: "none",
            backgroundColor: "transparent",
            color: themeObj.colorText,
            fontSize: "15px",
          }
        />
      </div>
      <RenderIf condition={showError}>
        <div role="alert" style={fontSize: "12px", color: themeObj.colorDanger}>
          {React.string(errorText)}
        </div>
      </RenderIf>
    </div>

    <div
      style={
        padding: "10px 12px",
        borderRadius: themeObj.borderRadius,
        backgroundColor: "rgba(148, 163, 184, 0.10)",
        fontSize: "12px",
        lineHeight: "1.45",
        color: themeObj.colorTextSecondary,
      }>
      {React.string(activeMeta.approvalHint)}
    </div>

    <Surcharge paymentMethod="wallet" paymentMethodType=resolvedOperator />
    <Terms paymentMethod="wallet" paymentMethodType=resolvedOperator />
  </div>
}

let default = make
