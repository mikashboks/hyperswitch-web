@react.component
let make = (~size=16, ~className="") => {
  <svg
    width={size->Int.toString}
    height={size->Int.toString}
    viewBox="0 0 32 32"
    className
    ariaHidden=true
    fill="none">
    <rect width="32" height="32" rx="6" fill="#006DF9" />
    <path
      d="M8 24V8L16 18.667V8H18V24L10 13.333V24H8Z"
      fill="white"
      stroke="white"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <path
      d="M18 8H21L24 8V24H21V13.333L18 8Z"
      fill="white"
      stroke="white"
      strokeWidth="0.6"
      strokeLinejoin="round"
      opacity="0.7"
    />
  </svg>
}
