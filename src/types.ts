/** The single timeline has three data modes. The user thinks about the data, not the mode. */
export type Mode = 'archive' | 'live' | 'forecast'

export const modeLabel: Record<Mode, string> = {
  archive: 'Archive',
  live: 'Live',
  forecast: 'Forecast',
}

/** Icon that accompanies each mode wherever it is shown (never colour alone). */
export const modeIcon = {
  archive: 'archive',
  live: null,
  forecast: 'forecast',
} as const
