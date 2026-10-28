/** Colors sampled from the Dynamix Services logo cube and wordmark. */
export const BRAND = {
  violet: '#3B2176',
  blue: '#4A6AAD',
  green: '#22B135',
  red: '#D10424',
  yellow: '#F1CA15',
  violetSoft: '#E8DDF5',
}

export const CHART_COLORS = [
  BRAND.violet,
  BRAND.blue,
  BRAND.green,
  BRAND.red,
  BRAND.yellow,
]

/**
 * Each cube colour with a "text-safe" ink variant. The raw brand colours are
 * great for blocks, rules and dots, but yellow (and to a lesser degree green)
 * is too light to read as text or a thin icon on paper, so `ink` is used there.
 * `on` is the readable text colour when the raw colour is used as a background.
 */
export const CUBE = {
  violet: { color: BRAND.violet, ink: '#3B2176', tint: '#EDE7F6', on: '#FFFFFF' },
  blue: { color: BRAND.blue, ink: '#3A5A9B', tint: '#E8EEF8', on: '#FFFFFF' },
  green: { color: BRAND.green, ink: '#177F29', tint: '#E4F5E7', on: '#FFFFFF' },
  red: { color: BRAND.red, ink: '#B40320', tint: '#FBE6EA', on: '#FFFFFF' },
  yellow: { color: BRAND.yellow, ink: '#8F6D00', tint: '#FBF3CC', on: '#161128' },
}

export const CUBE_ORDER = ['violet', 'blue', 'green', 'yellow', 'red']

/** One colour per area of the app. Drives the sidebar, page header, focus rings, tabs. */
export const SECTION_COLORS = {
  '/dashboard': 'violet',
  '/employees': 'blue',
  '/leaves': 'green',
  '/holidays': 'red',
  '/salary-advances': 'yellow',
  '/projects': 'violet',
  '/attendance': 'blue',
  '/fingerprint': 'green',
  '/settings': 'red',
  '/profile': 'yellow',
}

/** Section palette entry for a pathname (falls back to violet). */
export function sectionFor(pathname = '') {
  const key = Object.keys(SECTION_COLORS).find((p) => pathname === p || pathname.startsWith(`${p}/`))
  return CUBE[SECTION_COLORS[key] || 'violet']
}

/** Stable colour for a person, derived from their name, so avatars aren't all the same violet. */
export function avatarFor(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return CUBE[CUBE_ORDER[hash % CUBE_ORDER.length]]
}
