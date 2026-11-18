// V2 client secrets are opaque. Bind this read to the payment initialized by
// elements(), instead of deriving an id or using merchant/reviewer credentials.
let retrieve = async (
  ~backendUrl,
  ~publishableKey,
  ~profileId,
  ~tenantId,
  ~paymentId,
  ~initializedClientSecret,
  ~clientSecret,
  ~customPodUri="",
  ~timeoutMs=0,
) => {
  if (
    paymentId == "" ||
    profileId == "" ||
    clientSecret == "" ||
    clientSecret != initializedClientSecret ||
    !(publishableKey->String.startsWith("pk_"))
  ) {
    JSON.Encode.null
  } else {
    let controller = Fetch.AbortController.make()
    let timer =
      timeoutMs > 0
        ? Some(Js.Global.setTimeout(() => controller->Fetch.AbortController.abort, timeoutMs))
        : None
    let clearTimer = () => timer->Option.forEach(timer => Js.Global.clearTimeout(timer))
    try {
      let headers = Fetch.Headers.fromArray([
        ("Authorization", `publishable-key=${publishableKey},client-secret=${clientSecret}`),
        ("x-profile-id", profileId),
      ])

      // Do not invent a tenant or silently send a different merchant's credentials.
      if tenantId != "" {
        headers->Fetch.Headers.set("x-tenant-id", tenantId)
      }
      if customPodUri != "" {
        headers->Fetch.Headers.set("x-feature", customPodUri)
      }
      let paymentPath = paymentId->Js.Global.encodeURIComponent
      let response = await Fetch.fetch(
        `${backendUrl}/v2/payments/${paymentPath}/get-intent`,
        {
          method: #GET,
          headers,
          cache: #"no-store",
          signal: controller->Fetch.AbortController.signal,
        },
      )
      let result = if response->Fetch.Response.ok {
        let data = await response->Fetch.Response.json
        switch data->JSON.Decode.object {
        | Some(fields) =>
          let matches = key => fields->Dict.get(key)->Option.flatMap(JSON.Decode.string)
          if matches("id") == Some(paymentId) && matches("profile_id") == Some(profileId) {
            [("paymentIntent", data)]->Dict.fromArray->JSON.Encode.object
          } else {
            JSON.Encode.null
          }
        | None => JSON.Encode.null
        }
      } else {
        JSON.Encode.null
      }
      clearTimer()
      result
    } catch {
    | _ => {
        clearTimer()
        JSON.Encode.null
      }
    }
  }
}
