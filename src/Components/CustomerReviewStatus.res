type dateFormatter
type dateOptions = {
  year: string,
  month: string,
  day: string,
  hour: string,
  minute: string,
  timeZoneName: string,
}
@new @scope("Intl")
external makeDateFormatter: (option<string>, dateOptions) => dateFormatter = "DateTimeFormat"
@send external formatDate: (dateFormatter, Js.Date.t) => string = "format"

let readableTime = (~locale, iso) => {
  let options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }
  // Use the SDK's resolved locale and the browser's local time zone. Keep an
  // invalid locale override from hiding the already-confirmed payment view.
  let formatter = try {makeDateFormatter(Some(locale), options)} catch {
  | _ => makeDateFormatter(None, options)
  }
  formatter->formatDate(Js.Date.fromString(iso))
}

@react.component
let make = (~snapshot: CustomerReview.snapshot, ~onCheck: unit => promise<bool>) => {
  let {localeString} = Recoil.useRecoilValueFromAtom(RecoilAtoms.configAtom)
  let (checking, setChecking) = React.useState(_ => false)
  let (unavailable, setUnavailable) = React.useState(_ => false)
  let check = async _ => {
    setChecking(_ => true)
    let refreshed = try {await onCheck()} catch {
    | _ => false
    }
    setUnavailable(_ => !refreshed)
    setChecking(_ => false)
  }
  <section role="status" ariaLive=#polite ariaAtomic=true className="p-4 flex flex-col gap-3">
    <h2 className="font-semibold">
      {React.string(snapshot.review->Option.isSome ? "Payment review" : "Payment status updated")}
    </h2>
    {switch snapshot.review {
    | Some(review) =>
      <>
        <p> {React.string(review.message)} </p>
        <p>
          {React.string("Last checked: ")}
          <time dateTime={review.asOf}>
            {React.string(readableTime(~locale=localeString.locale, review.asOf))}
          </time>
        </p>
      </>
    | None =>
      <>
        <p>
          {React.string(`Current payment status: ${snapshot.status->String.replaceAll("_", " ")}.`)}
        </p>
        <p>
          {React.string(
            "Check this payment's status before paying again. Contact support if you need help with this payment.",
          )}
        </p>
      </>
    }}
    {unavailable
      ? <p role="alert">
          {React.string(
            "We could not check the latest status. The last confirmed information is still shown. Check this payment before paying again.",
          )}
        </p>
      : React.null}
    <button
      type_="button"
      disabled=checking
      onClick={event => check(event)->ignore}
      className="underline py-2">
      {React.string(checking ? "Checking payment status…" : "Check payment status")}
    </button>
  </section>
}
