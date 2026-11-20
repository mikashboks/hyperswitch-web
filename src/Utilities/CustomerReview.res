// Only the authenticated same-payment read creates this display state.
type context = {
  backendUrl: string,
  publishableKey: string,
  profileId: string,
  tenantId: string,
  paymentId: string,
  clientSecret: string,
  customPodUri: string,
}
type review = {state: string, message: string, asOf: string}
type snapshot = {
  scopeKey: string,
  paymentId: string,
  profileId: string,
  status: string,
  checkedAt: string,
  review: option<review>,
}
let key = (~backendUrl, ~publishableKey, ~tenantId, ~customPodUri, ~paymentId, ~profileId) =>
  [backendUrl, publishableKey, tenantId, customPodUri, paymentId, profileId]
  ->Array.map(JSON.Encode.string)
  ->JSON.Encode.array
  ->JSON.stringify

let text = (fields, key) =>
  fields->Dict.get(key)->Option.flatMap(JSON.Decode.string)->Option.getOr("")
let knownReview = state =>
  [
    "under_review",
    "approved_pending_resume",
    "approval_expired",
    "review_rejected",
    "outcome_unknown",
  ]->Array.includes(state)
let knownStatus = status =>
  [
    "succeeded",
    "failed",
    "cancelled",
    "processing",
    "requires_payment_method",
    "requires_confirmation",
    "requires_customer_action",
    "requires_merchant_action",
    "requires_capture",
    "partially_captured",
    "partially_captured_and_capturable",
    "partially_authorized_and_requires_capture",
    "partially_captured_and_processing",
    "cancelled_post_capture",
    "conflicted",
    "expired",
    "review",
  ]->Array.includes(status)

// These messages describe the router status only; no refund, available balance,
// destination credit, or permission to pay again can be inferred from it.
let statusMessage = status =>
  switch status {
  | "succeeded" => "This payment succeeded."
  | "failed" => "This payment failed. This does not confirm whether money was taken or returned."
  | "cancelled"
  | "cancelled_post_capture" => "This payment was cancelled. This does not confirm that money has been returned or is available."
  | "processing" => "Your payment is still being processed."
  | "requires_customer_action" => "This payment needs another step from you. Contact the merchant or support to check the existing payment."
  | "requires_merchant_action" => "This payment needs a check by the merchant."
  | "requires_payment_method" => "This payment needs a payment method. Contact the merchant or support before continuing."
  | "requires_confirmation" => "This payment is waiting for confirmation."
  | "requires_capture" => "This payment is authorized and waiting for the merchant to collect it."
  | "partially_captured" => "Only part of this payment was collected. Contact the merchant or support to check the amount."
  | "partially_captured_and_capturable" => "Part of this payment was collected. The merchant may still collect the rest."
  | "partially_authorized_and_requires_capture" => "Part of this payment is authorized and waiting for the merchant to collect it."
  | "partially_captured_and_processing" => "Part of this payment was collected. The rest is still being processed."
  | "expired" => "This payment expired before it could be collected. This does not confirm that reserved money is available."
  | "conflicted" => "This payment has conflicting amount or currency records. Contact support to check it before paying again."
  | _ => "We cannot confirm this payment's outcome. Check this payment or contact support before paying again."
  }

let parse = (result, context: context) => {
  let intent =
    result
    ->JSON.Decode.object
    ->Option.flatMap(fields => fields->Dict.get("paymentIntent"))
    ->Option.flatMap(JSON.Decode.object)
  switch intent {
  | Some(fields)
    if text(fields, "id") == context.paymentId &&
    text(fields, "profile_id") == context.profileId &&
    knownStatus(text(fields, "status")) =>
    let status = text(fields, "status")
    let review =
      fields
      ->Dict.get("customer_review")
      ->Option.flatMap(JSON.Decode.object)
      ->Option.flatMap(view => {
        let state = text(view, "state")
        let message = text(view, "message")
        let asOf = text(view, "as_of")
        let version = view->Dict.get("schema_version")->Option.flatMap(JSON.Decode.float)
        if (
          status == "review" &&
          version == Some(1.0) &&
          knownReview(state) &&
          message != "" &&
          message->String.length <= 1024 &&
          !Js.Float.isNaN(Js.Date.parseAsFloat(asOf))
        ) {
          Some({state, message, asOf})
        } else {
          None
        }
      })
    if status == "review" && review->Option.isNone {
      None
    } else {
      Some({
        scopeKey: key(
          ~backendUrl=context.backendUrl,
          ~publishableKey=context.publishableKey,
          ~tenantId=context.tenantId,
          ~customPodUri=context.customPodUri,
          ~paymentId=context.paymentId,
          ~profileId=context.profileId,
        ),
        paymentId: context.paymentId,
        profileId: context.profileId,
        status,
        checkedAt: Js.Date.make()->Js.Date.toISOString,
        review,
      })
    }
  | _ => None
  }
}

// Each context accepts only its latest-started read, including delayed refreshes.
let readVersions: Dict.t<int> = Dict.make()
let nextRead = ref(0)
let read = async (context: context) => {
  let scopeKey = key(
    ~backendUrl=context.backendUrl,
    ~publishableKey=context.publishableKey,
    ~tenantId=context.tenantId,
    ~customPodUri=context.customPodUri,
    ~paymentId=context.paymentId,
    ~profileId=context.profileId,
  )
  nextRead.contents = nextRead.contents + 1
  let version = nextRead.contents
  readVersions->Dict.set(scopeKey, version)
  let result = await CustomerIntentRead.retrieve(
    ~backendUrl=context.backendUrl,
    ~publishableKey=context.publishableKey,
    ~profileId=context.profileId,
    ~tenantId=context.tenantId,
    ~paymentId=context.paymentId,
    ~initializedClientSecret=context.clientSecret,
    ~clientSecret=context.clientSecret,
    ~customPodUri=context.customPodUri,
    ~timeoutMs=750,
  )
  readVersions->Dict.get(scopeKey) == Some(version) ? parse(result, context) : None
}

// The callback is supplied only by the v2 payment form, never by v1 or PM management.
let afterPrecondition = async (~statusCode, ~uri, ~context, ~onReview, ~onHandled, ~fallback) => {
  switch (statusCode, context, onReview) {
  | (412, Some(context), Some(onReview))
    if uri == `${context.backendUrl}/payments/${context.paymentId}/confirm` ||
      uri == `${context.backendUrl}/v2/payments/${context.paymentId}/confirm-intent` =>
    let snapshot = await read(context)
    switch snapshot {
    | Some(snapshot) if snapshot.review->Option.isSome =>
      onReview(snapshot)
      await onHandled(snapshot)
    | _ => await fallback()
    }
  | _ => await fallback()
  }
}

let lookup = (snapshots, scopeKey) => snapshots->Dict.get(scopeKey)
let remember = (snapshots, snapshot: snapshot) => {
  let next = snapshots->Dict.toArray->Dict.fromArray
  next->Dict.set(snapshot.scopeKey, snapshot)
  next
}

// This consumer is limited to the explicit hosted-v2 credential delivered by
// the normal mount message. It never derives tenant/profile from URL guesses.
@module("./HostedCustomerContext.js")
external hostedContext: (string, option<string>, string, string) => option<context> =
  "hostedContext"

let contextForKeys = (keys: CommonHooks.keys, customPodUri) =>
  switch hostedContext(keys.customerBackendUrl, keys.sdkAuthorization, keys.publishableKey, customPodUri) {
  | Some(_) as context => context
  | None if
      GlobalVars.sdkApiVersion == "v2" &&
      keys.sdkAuthorization->Option.getOr("") == "" &&
      keys.customerBackendUrl != "" &&
      keys.paymentId != "" &&
      keys.profileId != "" =>
    keys.clientSecret->Option.map(clientSecret => {
      backendUrl: keys.customerBackendUrl,
      publishableKey: keys.publishableKey,
      profileId: keys.profileId,
      tenantId: keys.tenantId,
      paymentId: keys.paymentId,
      clientSecret,
      customPodUri,
    })
  | None => None
  }

type view = {context: context, snapshot: snapshot}
type store
@module("jotai") external useStore: unit => store = "useStore"
@send external getAtom: (store, Jotai.atom<'a>) => 'a = "get"
let scope = (context: context) =>
  key(
    ~backendUrl=context.backendUrl,
    ~publishableKey=context.publishableKey,
    ~tenantId=context.tenantId,
    ~customPodUri=context.customPodUri,
    ~paymentId=context.paymentId,
    ~profileId=context.profileId,
  )
