// Routing context only; the router still authenticates the credential in that tenant.
@val external atob: string => string = "atob"

let fromAuthorization = (authorization: option<string>): option<string> => {
  try {
    authorization->Option.flatMap(value => {
      let entries = value->atob->String.split(",")->Array.filter(entry => entry->String.startsWith("tenant_id="))
      if entries->Array.length !== 1 {
        None
      } else {
        let tenant = entries->Array.get(0)->Option.getOr("")->String.sliceToEnd(~start=10)
        %re("/^[A-Za-z0-9_-]{1,64}$/")->RegExp.test(tenant) ? Some(tenant) : None
      }
    })
  } catch {
  | _ => None
  }
}
