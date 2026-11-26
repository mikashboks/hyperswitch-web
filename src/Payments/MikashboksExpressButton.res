open JotaiAtoms

module Loader = {
  @react.component
  let make = () => {
    <div className="w-5 h-5 text-emerald-200 animate-spin fill-emerald-400">
      <Icon size=20 name="loader" />
    </div>
  }
}

@react.component
let make = (~walletOptions) => {
  let loggerState = Jotai.useAtomValue(loggerAtom)
  let {themeObj} = Jotai.useAtomValue(configAtom)
  let (clicked, setClicked) = React.useState(_ => false)
  let (statusError, setStatusError) = React.useState(_ => "")
  let sdkHandleIsThere = Jotai.useAtomValue(isPaymentButtonHandlerProvidedAtom)
  let {publishableKey, parentURL, iframeId} = Jotai.useAtomValue(keys)
  let options = Jotai.useAtomValue(optionAtom)
  let setAreOneClickWalletsRendered = Jotai.useSetAtom(areOneClickWalletsRendered)
  let setIsShowOrPayUsing = Jotai.useSetAtom(isShowOrPayUsing)
  let updateSession = Jotai.useAtomValue(updateSession)
  let isTestMode = Jotai.useAtomValue(JotaiAtoms.isTestMode)
  let isManualRetryEnabled = Jotai.useAtomValue(JotaiAtoms.isManualRetryEnabled)
  let {country, state, pinCode} = PaymentUtils.useNonPiiAddressData()
  let paymentMethod = "wallet"
  let paymentMethodType = "mikashboks"
  let isWallet = walletOptions->Array.includes(paymentMethodType)

  let intent = PaymentHelpers.usePaymentIntent(Some(loggerState), Other)

  UtilityHooks.useHandlePostMessages(
    ~complete=clicked || !isWallet,
    ~empty=false,
    ~paymentType=paymentMethodType,
  )
  let emitter = SubscriptionEventHooks.useSubscriptionEventEmitter()
  SubscriptionEventHooks.useEmitFormStatus(
    ~empty=false,
    ~complete=clicked || !isWallet,
    ~isOneClickWallet=isWallet,
  )

  let handleIntentResult = React.useCallback((val: JSON.t) => {
    setClicked(_ => false)
    let dict = val->Utils.getDictFromJson
    switch dict->Dict.get("error") {
    | Some(_) =>
      let errorObj = PaymentError.itemToObjMapper(dict)
      let displayMessage = if (
        (errorObj.error.type_ === "payment_under_review" ||
          errorObj.error.type_ === "payment_status_requires_check") &&
        errorObj.error.message !== ""
      ) {
        errorObj.error.message
      } else if (
        errorObj.error.type_ === "server_error" ||
        errorObj.error.type_ === "confirm_payment_failed" ||
        errorObj.error.message === "" ||
        errorObj.error.message === "Something went wrong" ||
        errorObj.error.message === "Payment failed. Try again!"
      ) {
        "We cannot confirm this payment yet. Check its status before paying again."
      } else {
        errorObj.error.message
      }
      setStatusError(_ => displayMessage)
    | None => ()
    }
  }, [])

  let emitSelectionContext = () => {
    PaymentUtils.emitPaymentMethodInfo(
      ~paymentMethod,
      ~paymentMethodType,
      ~country,
      ~state,
      ~pinCode,
    )
    emitter.emitPaymentMethodStatus(
      ~paymentMethod,
      ~paymentMethodType,
      ~isSavedPaymentMethod=false,
      ~isOneClickWallet=isWallet,
    )
    emitter.emitBillingAddress(~country, ~state, ~postalCode=pinCode)
  }

  let startMikashboksExpressCheckout = () => {
    if isTestMode {
      Console.warn("MiKashBoks button clicked in test mode - interaction disabled")
    } else {
      let returnUrl = options.wallets.walletReturnUrl->String.trim
      if returnUrl === "" {
        let message = "Checkout return URL is missing. Contact the merchant to check this payment."
        setStatusError(_ => message)
        Utils.postFailedSubmitResponse(~errortype="invalid_return_url", ~message)
      } else {
        emitSelectionContext()
        setStatusError(_ => "")
        setClicked(_ => true)
        open Promise
        Utils.makeOneClickHandlerPromise(sdkHandleIsThere, ~parentOrigin=parentURL)
        ->then(result => {
          let accepted = result->JSON.Decode.bool->Option.getOr(false)
          if accepted {
            let body = PaymentBody.dynamicPaymentBody(paymentMethod, paymentMethodType)
            intent(
              ~bodyArr=body,
              ~confirmParam={
                return_url: returnUrl,
                publishableKey,
              },
              ~handleUserError=false,
              ~iframeId,
              ~manualRetry=isManualRetryEnabled,
              ~intentCallback=handleIntentResult,
            )
          } else {
            setClicked(_ => false)
          }
          resolve()
        })
        ->catch(_ => {
          setClicked(_ => false)
          setStatusError(_ =>
            "We cannot confirm this payment yet. Check its status before paying again."
          )
          resolve()
        })
        ->ignore
      }
    }
  }

  React.useEffect(() => {
    if isWallet {
      setAreOneClickWalletsRendered(prev => {
        ...prev,
        isMikashboks: true,
      })
      setIsShowOrPayUsing(_ => true)
      Some(
        () => {
          setAreOneClickWalletsRendered(prev => {
            ...prev,
            isMikashboks: false,
          })
        },
      )
    } else {
      None
    }
  }, [isWallet])

  let submitCallback = React.useCallback((ev: Window.event) => {
    if !isWallet {
      let json = ev.data->Utils.safeParse
      let confirm = json->Utils.getDictFromJson->ConfirmType.itemToObjMapper
      if confirm.doSubmit && !options.readOnly {
        if isTestMode {
          Console.warn("MiKashBoks confirm ignored in test mode - interaction disabled")
        } else {
          let trimmedConfirmReturnUrl = confirm.confirmParams.return_url->String.trim
          let returnUrl =
            trimmedConfirmReturnUrl !== ""
              ? trimmedConfirmReturnUrl
              : options.wallets.walletReturnUrl->String.trim
          if returnUrl === "" {
            let message = "Checkout return URL is missing. Contact the merchant to check this payment."
            setStatusError(_ => message)
            Utils.postFailedSubmitResponse(~errortype="invalid_return_url", ~message)
          } else {
            let resolvedPublishableKey =
              confirm.confirmParams.publishableKey !== ""
                ? confirm.confirmParams.publishableKey
                : publishableKey
            let confirmParam: ConfirmType.confirmParams = {
              ...confirm.confirmParams,
              return_url: returnUrl,
              publishableKey: resolvedPublishableKey,
            }
            emitSelectionContext()
            setStatusError(_ => "")
            setClicked(_ => true)
            let body = PaymentBody.dynamicPaymentBody(paymentMethod, paymentMethodType)
            intent(
              ~bodyArr=body,
              ~confirmParam,
              ~handleUserError=false,
              ~iframeId,
              ~manualRetry=isManualRetryEnabled,
              ~intentCallback=handleIntentResult,
            )
          }
        }
      }
    }
  }, (
    isWallet,
    isTestMode,
    options.readOnly,
    options.wallets.walletReturnUrl,
    publishableKey,
    iframeId,
    isManualRetryEnabled,
    country,
    state,
    pinCode,
    intent,
    handleIntentResult,
  ))

  PaymentMessageHooks.useSubmitPaymentData(submitCallback)

  if isWallet {
    <div className="w-full flex flex-col gap-1.5">
      <button
        type_="button"
        ariaLabel="Pay with MiKashBoks"
        disabled={clicked || updateSession || options.readOnly}
        onClick={_ => options.readOnly ? () : startMikashboksExpressCheckout()}
        style={
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          width: "100%",
          height: "50px",
          borderRadius: "10px",
          backgroundColor: "#0B3B2E",
          border: "1px solid #10B981",
          color: "#FFFFFF",
          cursor: clicked || updateSession || options.readOnly ? "not-allowed" : "pointer",
          pointerEvents: updateSession ? "none" : "auto",
          opacity: updateSession || options.readOnly ? "0.55" : "1.0",
          padding: "0 16px",
        }>
        {if clicked {
          <>
            <Loader />
            <span style={fontSize: "15px", fontWeight: "700", letterSpacing: "-0.01em"}>
              {React.string("Opening MiKashBoks...")}
            </span>
          </>
        } else {
          <>
            <span
              ariaHidden=true
              style={
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "24px",
                height: "24px",
                borderRadius: "6px",
                backgroundColor: "#10B981",
                color: "#052E16",
                fontSize: "13px",
                fontWeight: "900",
              }>
              {React.string("M")}
            </span>
            <span style={fontSize: "15px", fontWeight: "700", letterSpacing: "-0.01em"}>
              {React.string("Pay with MiKashBoks")}
            </span>
          </>
        }}
      </button>
      <RenderIf condition={statusError !== ""}>
        <div role="alert" style={fontSize: "12px", color: themeObj.colorDanger}>
          {React.string(statusError)}
        </div>
      </RenderIf>
    </div>
  } else {
    <div className="w-full flex flex-col gap-2">
      <div
        className="w-full flex flex-col gap-2 p-3 rounded-lg"
        style={
          backgroundColor: "rgba(16, 185, 129, 0.08)",
          border: "1px solid rgba(16, 185, 129, 0.25)",
        }>
        <div style={fontSize: "13px", fontWeight: "600"}>
          {React.string("Approve in MiKashBoks")}
        </div>
        <div style={fontSize: "12px", opacity: "0.85"}>
          {React.string(
            "Continue to MiKashBoks to review and confirm with your MiKashBoks PIN — never enter your MiKashBoks PIN on this page.",
          )}
        </div>
      </div>
      <RenderIf condition={statusError !== ""}>
        <div role="alert" style={fontSize: "12px", color: themeObj.colorDanger}>
          {React.string(statusError)}
        </div>
      </RenderIf>
      <Surcharge paymentMethod paymentMethodType />
      <Terms paymentMethod paymentMethodType />
    </div>
  }
}

let default = make
