/**
 * Dynamix icon set.
 *
 * Drawn on a 24px grid with square caps and mitred joins (the same hard
 * corners as the cube logo) and a faint tinted fill under the main shape.
 * Names match the previous heroicons API so call sites only changed their
 * import path.
 */

const tint = (d) => <path d={d} fill="currentColor" fillOpacity="0.14" stroke="none" />

const make = (name, body) => {
  const Icon = ({ className, ...props }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {body}
    </svg>
  )
  Icon.displayName = name
  return Icon
}

const P = ({ d }) => <path d={d} />

/* ---- arrows & chevrons ------------------------------------------------ */
export const ArrowRightIcon = make('ArrowRightIcon', <P d="M4 12h16M14 6l6 6-6 6" />)
export const ArrowLeftIcon = make('ArrowLeftIcon', <P d="M20 12H4M10 6l-6 6 6 6" />)
export const ArrowUpRightIcon = make('ArrowUpRightIcon', <P d="M6 18 18 6M8 6h10v10" />)
export const ArrowDownTrayIcon = make('ArrowDownTrayIcon', <P d="M12 4v11M7 11l5 5 5-5M4 20h16" />)
export const ArrowUpTrayIcon = make('ArrowUpTrayIcon', <P d="M12 16V5M7 9l5-5 5 5M4 20h16" />)
export const ArrowPathIcon = make('ArrowPathIcon', <P d="M20 9A8 8 0 0 0 5.5 7M4 4v4h4M4 15a8 8 0 0 0 14.5 2M20 20v-4h-4" />)
export const ArrowRightOnRectangleIcon = make(
  'ArrowRightOnRectangleIcon',
  <>
    <P d="M14 4h6v16h-6M3 12h12M10 7l5 5-5 5" />
  </>,
)
export const ChevronDownIcon = make('ChevronDownIcon', <P d="M5 9l7 7 7-7" />)
export const ChevronUpIcon = make('ChevronUpIcon', <P d="M5 15l7-7 7 7" />)
export const ChevronLeftIcon = make('ChevronLeftIcon', <P d="M15 5l-7 7 7 7" />)
export const ChevronRightIcon = make('ChevronRightIcon', <P d="M9 5l7 7-7 7" />)

/* ---- marks ------------------------------------------------------------ */
export const PlusIcon = make('PlusIcon', <P d="M12 4v16M4 12h16" />)
export const XMarkIcon = make('XMarkIcon', <P d="M5 5l14 14M19 5L5 19" />)
export const CheckIcon = make('CheckIcon', <P d="M4 12.5l5 5L20 6.5" />)
export const Bars3Icon = make('Bars3Icon', <P d="M4 6h16M4 12h16M4 18h16" />)

export const CheckCircleIcon = make(
  'CheckCircleIcon',
  <>
    {tint('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z')}
    <circle cx="12" cy="12" r="9" />
    <P d="M7.5 12.5l3 3 6-6.5" />
  </>,
)
export const XCircleIcon = make(
  'XCircleIcon',
  <>
    {tint('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z')}
    <circle cx="12" cy="12" r="9" />
    <P d="M9 9l6 6M15 9l-6 6" />
  </>,
)
export const InformationCircleIcon = make(
  'InformationCircleIcon',
  <>
    {tint('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z')}
    <circle cx="12" cy="12" r="9" />
    <P d="M12 11v6M12 7.5v.01" />
  </>,
)
export const QuestionMarkCircleIcon = make(
  'QuestionMarkCircleIcon',
  <>
    {tint('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z')}
    <circle cx="12" cy="12" r="9" />
    <P d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17v.01" />
  </>,
)
export const NoSymbolIcon = make(
  'NoSymbolIcon',
  <>
    <circle cx="12" cy="12" r="9" />
    <P d="M5.6 5.6l12.8 12.8" />
  </>,
)
export const ExclamationTriangleIcon = make(
  'ExclamationTriangleIcon',
  <>
    {tint('M12 3 22 20H2z')}
    <P d="M12 3 22 20H2zM12 10v5M12 17.5v.01" />
  </>,
)

/* ---- people ----------------------------------------------------------- */
export const UserIcon = make(
  'UserIcon',
  <>
    {tint('M12 3.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z')}
    <P d="M12 3.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM4 21c0-4.5 3.5-7 8-7s8 2.5 8 7" />
  </>,
)
export const UserCircleIcon = make(
  'UserCircleIcon',
  <>
    <circle cx="12" cy="12" r="9" />
    <P d="M12 8a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M6.5 18.5c1-3 3-4.5 5.5-4.5s4.5 1.500 5.500 4.500" />
  </>,
)
export const UsersIcon = make(
  'UsersIcon',
  <>
    {tint('M9 4a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z')}
    <P d="M9 4a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM2 20c0-3.500 3-6 7-6s7 2.500 7 6M16 4.500a3 3 0 0 1 0 6M18.500 14.500c2 .7 3.500 2.500 3.500 5.500" />
  </>,
)
export const UserGroupIcon = UsersIcon
export const UserPlusIcon = make(
  'UserPlusIcon',
  <>
    {tint('M10 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z')}
    <P d="M10 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM2.500 21c0-4 3-6.500 7.500-6.500 1.500 0 2.800.3 3.800.8M19 8v6M16 11h6" />
  </>,
)
export const IdentificationIcon = make(
  'IdentificationIcon',
  <>
    {tint('M3 5h18v14H3z')}
    <P d="M3 5h18v14H3zM9 8.500a1.500 1.500 0 1 0 0 3 1.500 1.500 0 0 0 0-3M6 16c.5-2 5.500-2 6 0M14 10h4M14 14h4" />
  </>,
)
export const AcademicCapIcon = make(
  'AcademicCapIcon',
  <>
    {tint('M12 4 2 9l10 5 10-5z')}
    <P d="M12 4 2 9l10 5 10-5zM6 11.500V16c1.500 1.500 3.500 2.500 6 2.500s4.500-1 6-2.500v-4.500M22 9v6" />
  </>,
)

/* ---- places & objects ------------------------------------------------- */
export const HomeIcon = make(
  'HomeIcon',
  <>
    {tint('M5.500 10 12 5l6.500 5v10h-13z')}
    <P d="M3 11.500 12 4l9 7.500M5.500 10v10h13V10M10 20v-6h4v6" />
  </>,
)
export const BuildingOfficeIcon = make(
  'BuildingOfficeIcon',
  <>
    {tint('M5 3h10v18H5z')}
    <P d="M5 21V3h10v18M15 9h4v12M3 21h18M8 7h4M8 11h4M8 15h4" />
  </>,
)
export const BuildingOffice2Icon = make(
  'BuildingOffice2Icon',
  <>
    {tint('M4 8l8-5 8 5v13H4z')}
    <P d="M4 21V8l8-5 8 5v13M2 21h20M9 21v-5h6v5M9 11h6" />
  </>,
)
export const BriefcaseIcon = make(
  'BriefcaseIcon',
  <>
    {tint('M3 8h18v12H3z')}
    <P d="M3 8h18v12H3zM9 8V4h6v4M3 13h18" />
  </>,
)
export const MapPinIcon = make(
  'MapPinIcon',
  <>
    <P d="M12 21s7-6.500 7-12a7 7 0 0 0-14 0c0 5.500 7 12 7 12zM12 7a2.500 2.500 0 1 0 0 5 2.500 2.500 0 0 0 0-5" />
  </>,
)
export const GlobeAltIcon = make(
  'GlobeAltIcon',
  <>
    <circle cx="12" cy="12" r="9" />
    <P d="M3 12h18M12 3c3.500 3 3.500 15 0 18M12 3c-3.500 3-3.500 15 0 18" />
  </>,
)
export const FlagIcon = make(
  'FlagIcon',
  <>
    {tint('M5 4h13l-2.500 4.500L18 13H5z')}
    <P d="M5 21V4M5 4h13l-2.500 4.500L18 13H5" />
  </>,
)
export const CakeIcon = make(
  'CakeIcon',
  <>
    {tint('M4 13h16v7H4z')}
    <P d="M4 20h16v-7H4zM6 13V9h12v4M12 9V6M12 3v1.500" />
  </>,
)
export const KeyIcon = make(
  'KeyIcon',
  <>
    <P d="M15 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM11.500 12.500 3 21M6 18l2.500 2.500" />
  </>,
)
export const ShieldCheckIcon = make(
  'ShieldCheckIcon',
  <>
    {tint('M12 3l8 3v6c0 4.500-3.200 8-8 9.500C7.200 20 4 16.500 4 12V6z')}
    <P d="M12 3l8 3v6c0 4.500-3.200 8-8 9.500C7.200 20 4 16.500 4 12V6zM8.500 12l2.500 2.500 4.500-5" />
  </>,
)
export const SwatchIcon = make(
  'SwatchIcon',
  <>
    {tint('M3 3h8v8H3zM13 13h8v8h-8z')}
    <P d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" />
  </>,
)
export const SparklesIcon = make(
  'SparklesIcon',
  <>
    {tint('M12 3l8 4.500v9L12 21l-8-4.500v-9z')}
    <P d="M12 3l8 4.500v9L12 21l-8-4.500v-9zM4 7.500l8 4.500 8-4.500M12 12v9" />
  </>,
)
export const FingerPrintIcon = make(
  'FingerPrintIcon',
  <>
    <P d="M4 11a8 8 0 0 1 16 0M7 20c1-1.500 1.500-3.500 1.500-6V11a3.500 3.500 0 0 1 7 0v1c0 3 .5 5 1.500 7M12 11v3.500c0 2-.5 3.500-1.500 5.500M20 14v1" />
  </>,
)

/* ---- documents & data ------------------------------------------------- */
export const DocumentTextIcon = make(
  'DocumentTextIcon',
  <>
    {tint('M6 3h8l5 5v13H6z')}
    <P d="M6 3h8l5 5v13H6zM14 3v5h5M9 13h7M9 17h7" />
  </>,
)
export const DocumentArrowDownIcon = make(
  'DocumentArrowDownIcon',
  <>
    {tint('M6 3h8l5 5v13H6z')}
    <P d="M6 3h8l5 5v13H6zM14 3v5h5M12 11v6M9.500 14.500 12 17l2.500-2.500" />
  </>,
)
export const ChartBarIcon = make(
  'ChartBarIcon',
  <>
    {tint('M6 11h3v9H6zM10.500 4h3v16h-3zM15 8h3v12h-3z')}
    <P d="M6 11h3v9H6zM10.500 4h3v16h-3zM15 8h3v12h-3zM3 20h18" />
  </>,
)
export const CalculatorIcon = make(
  'CalculatorIcon',
  <>
    {tint('M5 3h14v18H5z')}
    <P d="M5 3h14v18H5zM8 7h8M8 11.500h2M14 11.500h2M8 15h2M14 15h2M8 18h2M14 18h2" />
  </>,
)
export const BanknotesIcon = make(
  'BanknotesIcon',
  <>
    {tint('M2 6h20v12H2z')}
    <P d="M2 6h20v12H2zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM5.500 12h.01M18.500 12h.01" />
  </>,
)
export const CurrencyDollarIcon = make(
  'CurrencyDollarIcon',
  <>
    <circle cx="12" cy="12" r="9" />
    <P d="M14.500 9.500c-.5-1-1.500-1.500-2.500-1.500-1.500 0-2.500.8-2.500 2s1 1.700 2.500 2 2.500.8 2.500 2-1 2-2.500 2c-1 0-2-.5-2.500-1.500M12 6v2M12 16v2" />
  </>,
)

/* ---- time ------------------------------------------------------------- */
export const ClockIcon = make(
  'ClockIcon',
  <>
    {tint('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z')}
    <circle cx="12" cy="12" r="9" />
    <P d="M12 7v5l3.500 2" />
  </>,
)
export const CalendarIcon = make(
  'CalendarIcon',
  <>
    {tint('M3 5h18v5H3z')}
    <P d="M3 5h18v16H3zM3 10h18M8 3v4M16 3v4" />
  </>,
)
export const CalendarDaysIcon = make(
  'CalendarDaysIcon',
  <>
    {tint('M3 5h18v5H3z')}
    <P d="M3 5h18v16H3zM3 10h18M8 3v4M16 3v4M7 14h2M11 14h2M15 14h2M7 17.500h2M11 17.500h2" />
  </>,
)

/* ---- communication ---------------------------------------------------- */
export const BellIcon = make(
  'BellIcon',
  <>
    {tint('M6 17V11a6 6 0 0 1 12 0v6l2 2H4z')}
    <P d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4zM10 21.500h4" />
  </>,
)
export const EnvelopeIcon = make(
  'EnvelopeIcon',
  <>
    {tint('M3 5h18v14H3z')}
    <P d="M3 5h18v14H3zM3 6l9 7 9-7" />
  </>,
)
export const PhoneIcon = make(
  'PhoneIcon',
  <P d="M5 3h4l2 5-2.500 1.500a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2C10 21 3 14 3 5a2 2 0 0 1 2-2z" />,
)
export const DevicePhoneMobileIcon = make(
  'DevicePhoneMobileIcon',
  <>
    {tint('M7 2h10v20H7z')}
    <P d="M7 2h10v20H7zM11 18.500h2" />
  </>,
)

/* ---- interface -------------------------------------------------------- */
export const MagnifyingGlassIcon = make('MagnifyingGlassIcon', <P d="M10.500 3a7.500 7.500 0 1 0 0 15 7.500 7.500 0 0 0 0-15zM16 16l5 5" />)
export const FunnelIcon = make(
  'FunnelIcon',
  <>
    {tint('M3 4h18l-7 9v7l-4-2v-5z')}
    <P d="M3 4h18l-7 9v7l-4-2v-5z" />
  </>,
)
export const EyeIcon = make(
  'EyeIcon',
  <>
    <P d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6" />
  </>,
)
export const EyeSlashIcon = make(
  'EyeSlashIcon',
  <>
    <P d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M4 4l16 16" />
  </>,
)
export const PencilIcon = make(
  'PencilIcon',
  <>
    {tint('M4 20l1-5L16 4l4 4L9 19z')}
    <P d="M4 20l1-5L16 4l4 4L9 19zM14 6l4 4" />
  </>,
)
export const PencilSquareIcon = make('PencilSquareIcon', <P d="M11 4H4v16h16v-7M18 3l3 3-9 9-4 1 1-4z" />)
export const TrashIcon = make('TrashIcon', <P d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7" />)
export const SunIcon = make(
  'SunIcon',
  <>
    <circle cx="12" cy="12" r="4" />
    <P d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.500 1.500M17.500 17.500 19 19M19 5l-1.500 1.500M6.500 17.500 5 19" />
  </>,
)
export const MoonIcon = make('MoonIcon', <P d="M20 14.500A8.500 8.500 0 0 1 9.500 4 8.500 8.500 0 1 0 20 14.500z" />)
export const Cog6ToothIcon = make(
  'Cog6ToothIcon',
  <>
    {tint('M12 3l7.800 4.500v9L12 21l-7.800-4.500v-9z')}
    <P d="M12 3l7.800 4.500v9L12 21l-7.800-4.500v-9z" />
    <circle cx="12" cy="12" r="3" />
  </>,
)
export const CogIcon = Cog6ToothIcon
