let switchToInteg = false
let isLocal = false
let sdkDomainUrl = `${GlobalVars.sdkUrl}${GlobalVars.repoPublicPath}`

let apiEndPoint: ref<option<string>> = ref(None)

let setApiEndPoint = str => {
  apiEndPoint := Some(str)
}

let getApiEndPoint = (~publishableKey="", ~isConfirmCall=false) => {
  let testMode = publishableKey->String.startsWith("pk_snd_")
  switch apiEndPoint.contents {
  | Some(str) => str
  | None =>
    let backendEndPoint = isConfirmCall ? GlobalVars.confirmEndPoint : GlobalVars.backendEndPoint
    GlobalVars.isProd && testMode ? "https://beta.hyperswitch.io/api" : backendEndPoint
  }
}

let addCustomPodHeader = (arr: array<(string, string)>, ~customPodUri=?) => {
  switch customPodUri {
  | Some("")
  | None => ()
  | Some(customPodVal) => arr->Array.push(("x-feature", customPodVal))
  }
  arr->Dict.fromArray
}

// A capability must stay bound to its owning Hyper instance, even if another
// instance later changes the legacy mutable endpoint (including singleton reuse).
let resolveInstanceEndPoint = (~publishableKey, ~customBackendUrl) => {
  if customBackendUrl != "" {
    customBackendUrl
  } else if GlobalVars.isProd && publishableKey->String.startsWith("pk_snd_") {
    "https://beta.hyperswitch.io/api"
  } else {
    GlobalVars.backendEndPoint
  }
}
