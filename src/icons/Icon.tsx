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
