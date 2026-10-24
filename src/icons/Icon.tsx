import type { SVGProps } from 'react'
import { weatherPaths, type WeatherIconName } from './weather'

/** UI glyphs, 24×24, 1.5 stroke, currentColor. Drawn to sit with the Figma weather set. */
const uiIcons = {
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  locate: (
    <>
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21" />
    </>
  ),
  bell: (
    <>
      <path d="M6.5 16.5V11a5.5 5.5 0 1 1 11 0v5.5l1.5 1.5H5l1.5-1.5Z" />
      <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  play: <path d="M9.5 7.5v9l7-4.5-7-4.5Z" fill="currentColor" stroke="none" />,
  pause: <path d="M9 7.5v9M15 7.5v9" strokeWidth="2.25" />,
  'chevron-left': <path d="m14.5 6.5-5.5 5.5 5.5 5.5" />,
  'chevron-right': <path d="m9.5 6.5 5.5 5.5-5.5 5.5" />,
  // Archive: clock turning back. Forecast: its exact mirror (x → 24 − x), same clock hands.
  // Arc r = 8 around (12, 12), 315° long, open between 9 and 10:30; the arrow's corner sits on the arc's end.
  archive: (
    <>
      <path d="M4 12A8 8 0 1 0 6.343 6.343" />
      <path d="M10.343 6.343H6.343V2.343" />
      <path d="M12 8v4l3 1.5" />
    </>
  ),
  forecast: (
    <>
      <path d="M20 12A8 8 0 1 1 17.657 6.343" />
      <path d="M13.657 6.343H17.657V2.343" />
      <path d="M12 8v4l3 1.5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14.5" rx="2" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.75v.01" />
    </>
  ),
  warning: (
    <>
      <path d="M10.3 4.6 3.2 17.5A2 2 0 0 0 5 20.5h14a2 2 0 0 0 1.8-3L13.7 4.6a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.5v4.5M12 17v.01" />
    </>
  ),
  close: <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />,
  undo: (
    <>
      <path d="M8.5 14 4 9.5 8.5 5" />
      <path d="M4 9.5h10a5 5 0 0 1 0 10h-3" />
    </>
  ),
  'arrow-right': <path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5" />,
  thermometer: (
    <>
      <path d="M14 14.6V5a2 2 0 1 0-4 0v9.6a4 4 0 1 0 4 0Z" />
      <path d="M12 9v7" />
    </>
  ),
  waves: <path d="M3 7.5c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0M3 12c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0M3 16.5c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  // Alerts: subscriptions (Lucide 'settings', ISC licence).
  settings: (
    <>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  // Overlays: add a data on top of the main one; lightning symbol.
  stack: <path d="m12 4.5 8 4-8 4-8-4zM4 12.5l8 4 8-4M4 16l8 4 8-4" />,
  bolt: <path d="M13 3.5 6 13.5h5l-1 7 7.5-10.5h-5z" />,
  // Station series.
  chart: <path d="M4.5 19.5h15M7.5 16.5v-5M12 16.5v-9M16.5 16.5v-7" />,
  table: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M4 10h16M4 14.5h16M10 10v9" />
    </>
  ),
  download: <path d="M12 4.5v10M7.5 10.5l4.5 4.5 4.5-4.5M5 19.5h14" />,
  // Top bar: additional services, account; map tools.
  apps: (
    <>
      <circle cx="6.5" cy="6.5" r="1.5" />
      <circle cx="12" cy="6.5" r="1.5" />
      <circle cx="17.5" cy="6.5" r="1.5" />
      <circle cx="6.5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="17.5" cy="12" r="1.5" />
      <circle cx="6.5" cy="17.5" r="1.5" />
      <circle cx="12" cy="17.5" r="1.5" />
      <circle cx="17.5" cy="17.5" r="1.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 19.5c1-3.5 3.8-5.5 7-5.5s6 2 7 5.5" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="m6 6 3.5 3.5M14.5 14.5 18 18M18 6l-3.5 3.5M9.5 14.5 6 18" />
    </>
  ),
  'sign-out': <path d="M14 4.5H6.5v15H14M10.5 12h9M16.5 8.5l3.5 3.5-3.5 3.5" />,
  support: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4" />
      <circle cx="12" cy="12" r="7" />
    </>
  ),
  report: (
    <>
      <path d="M7 3.5h7l4 4v13H7z" />
      <path d="M14 3.5v4h4M9.5 12h6M9.5 15.5h6" />
    </>
  ),
  api: <path d="m8.5 7.5-4.5 4.5 4.5 4.5M15.5 7.5l4.5 4.5-4.5 4.5M13.5 5.5l-3 13" />,
  ruler: (
    <>
      <path d="m3.5 16 12.5-12.5 4.5 4.5L8 20.5z" />
      <path d="m7.5 12 2 2M10.5 9l2 2M13.5 6l2 2" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l1.5-2.5h7L17 8h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  basemap: <path d="M3.5 6.5 9 4.5l6 2 5.5-2v13l-5.5 2-6-2-5.5 2zM9 4.5v13M15 6.5v13" />,
  // Preset editing.
  edit: <path d="M4.5 19.5h4l10-10-4-4-10 10v4ZM13 7l4 4" />,
  trash: <path d="M4.5 7h15M10 4.5h4M6.5 7l1 12.5h9l1-12.5M10 11v5M14 11v5" />,
  check: <path d="m5.5 12.5 4 4 9-9" />,
  lock: (
    <>
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
} as const

type UiIconName = keyof typeof uiIcons
export type IconName = UiIconName | WeatherIconName

type IconProps = Omit<SVGProps<SVGSVGElement>, 'name'> & {
  name: IconName
  size?: number
}

/** Decorative by default (aria-hidden). Buttons carry the accessible name, not the glyph. */
export function Icon({ name, size = 20, ...rest }: IconProps) {
  if (name in weatherPaths) {
    return (
      <svg width={size} height={size} viewBox="20 20 32 32" fill="currentColor" aria-hidden="true" focusable="false" {...rest}>
        {weatherPaths[name as WeatherIconName].map((d, i) => (
          <path key={i} d={d} fillRule="evenodd" clipRule="evenodd" />
        ))}
      </svg>
    )
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {uiIcons[name as UiIconName]}
    </svg>
  )
}

export const iconNames = [...Object.keys(uiIcons), ...Object.keys(weatherPaths)] as IconName[]
