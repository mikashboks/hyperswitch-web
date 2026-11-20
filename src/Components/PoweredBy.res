@react.component
let make = (~className="pt-4") => {
  let {branding} = Jotai.useAtomValue(JotaiAtoms.optionAtom)
  let {localeString} = Jotai.useAtomValue(JotaiAtoms.configAtom)
  <RenderIf condition={branding == Auto}>
    <div
      className={`text-xs text-center w-full flex items-center justify-center gap-1.5 ${className}`}>
      <NooryMark />
      {localeString.poweredBy->React.string}
    </div>
  </RenderIf>
}
