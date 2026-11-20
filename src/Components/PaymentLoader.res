@react.component
let make = () => {
  let isTrustedParent = PaymentMessageHooks.useFullscreenParentCheck()
  open Utils
  let (branding, setBranding) = React.useState(_ => PaymentType.Never)

  React.useEffect0(() => {
    messageParentWindow([("iframeMountedCallback", true->JSON.Encode.bool)])
    let handle = (ev: Window.event) => {
      let json = ev.data->safeParse
      let dict = json->getDictFromJson
      if isTrustedParent(ev) && dict->Utils.getBool("fullScreenIframeMounted", false) {
        let preferences = dict->getDictFromDict("options")
        let value = preferences->getString("branding", "auto")
        setBranding(_ => value->PaymentType.getShowType("options.branding"))
      }
    }
    Window.addEventListener("message", handle)
    Some(() => {Window.removeEventListener("message", handle)})
  })

  let styles =
    branding === PaymentType.Auto
      ? "backdrop-blur-md bg-black/80"
      : "backdrop-contrast-125 backdrop-blur-2xl opacity-70 bg-black/80"

  <div className={`h-screen w-screen flex m-auto items-center ${styles}`}>
    <div className={`flex flex-col justify-center m-auto visible`}>
      <Loader branding />
    </div>
  </div>
}
