import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/**
 * Personalisation for the vendeur's Sales-Mode board.
 *
 * The vendeur picks a display LAYOUT, a BACKGROUND THEME and (optionally)
 * uploads a CUSTOM BACKGROUND image. Everything persists to localStorage so
 * the showroom remembers how it was last set up.
 */

export type LayoutId = 'bubbles' | 'grid' | 'map' | 'carousel'

export type ThemeKind = 'dark' | 'light'

export interface SalesTheme {
  id: string
  /** French label shown in the picker. */
  label: string
  kind: ThemeKind
  /** Full CSS `background` value painted on the backdrop. */
  background: string
  /** Hex used to tint the ambient drifting blobs. */
  glow: string
  /** CSS `background` for the small picker preview tile. */
  swatch: string
}

export const THEMES: SalesTheme[] = [
  {
    id: 'nuit-mg',
    label: 'Nuit MG',
    kind: 'dark',
    background:
      'radial-gradient(120% 120% at 18% 0%, #211013 0%, #120a0c 42%, #0b0708 100%)',
    glow: '#E11D24',
    swatch:
      'radial-gradient(120% 120% at 25% 15%, #3a161a 0%, #160c0e 60%, #0b0708 100%)',
  },
  {
    id: 'carbone',
    label: 'Carbone',
    kind: 'dark',
    background:
      'radial-gradient(120% 120% at 50% 0%, #232427 0%, #161719 45%, #0d0e10 100%)',
    glow: '#6b7280',
    swatch:
      'radial-gradient(120% 120% at 30% 15%, #2c2e31 0%, #18191b 60%, #0d0e10 100%)',
  },
  {
    id: 'ardoise',
    label: 'Ardoise',
    kind: 'dark',
    background:
      'radial-gradient(120% 120% at 25% 0%, #243042 0%, #18222f 45%, #0e151e 100%)',
    glow: '#5b8def',
    swatch:
      'radial-gradient(120% 120% at 30% 15%, #2c3a4f 0%, #1a2532 60%, #0e151e 100%)',
  },
  {
    id: 'profond',
    label: 'Profond',
    kind: 'dark',
    background:
      'radial-gradient(120% 120% at 50% 0%, #102045 0%, #0a162f 45%, #060b1a 100%)',
    glow: '#3b6fd4',
    swatch:
      'radial-gradient(120% 120% at 30% 15%, #16306a 0%, #0b182f 60%, #060b1a 100%)',
  },
  {
    id: 'aurore',
    label: 'Aurore',
    kind: 'dark',
    background:
      'linear-gradient(160deg, #140d24 0%, #0f1030 45%, #0a0a1c 100%)',
    glow: '#9b5cf6',
    swatch:
      'linear-gradient(140deg, #2a1850 0%, #1a1746 55%, #0a0a1c 100%)',
  },
  {
    id: 'showroom',
    label: 'Showroom',
    kind: 'light',
    background:
      'radial-gradient(120% 120% at 50% 0%, #ffffff 0%, #f4f3f1 55%, #ecebe8 100%)',
    glow: '#E11D24',
    swatch:
      'radial-gradient(120% 120% at 30% 20%, #ffffff 0%, #f1f0ee 70%, #e6e5e2 100%)',
  },
  {
    id: 'sable',
    label: 'Sable',
    kind: 'light',
    background:
      'radial-gradient(120% 120% at 30% 0%, #fbf6ee 0%, #f3ead9 55%, #ece0cb 100%)',
    glow: '#d8a24a',
    swatch:
      'radial-gradient(120% 120% at 30% 20%, #fbf4e7 0%, #f0e3cd 70%, #e7d8bd 100%)',
  },
]

export interface SalesSettings {
  layout: LayoutId
  themeId: string
  /** Downscaled data URL of an uploaded background, or null. */
  customBg: string | null
  float: boolean
}

const STORAGE_KEY = 'mg-sales-settings-v2'

const DEFAULT_THEME_ID = THEMES[0].id // "Nuit MG"

const DEFAULTS: SalesSettings = {
  layout: 'bubbles',
  themeId: DEFAULT_THEME_ID,
  customBg: null,
  float: true,
}

const LAYOUT_IDS: LayoutId[] = ['bubbles', 'grid', 'map', 'carousel']

function loadSettings(): SalesSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<SalesSettings>
    const layout =
      parsed.layout && LAYOUT_IDS.includes(parsed.layout)
        ? parsed.layout
        : DEFAULTS.layout
    const themeId =
      parsed.themeId && THEMES.some((t) => t.id === parsed.themeId)
        ? parsed.themeId
        : DEFAULTS.themeId
    return {
      layout,
      themeId,
      customBg: typeof parsed.customBg === 'string' ? parsed.customBg : null,
      float: typeof parsed.float === 'boolean' ? parsed.float : DEFAULTS.float,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

interface SalesSettingsContextValue extends SalesSettings {
  setLayout: (id: LayoutId) => void
  setThemeId: (id: string) => void
  setCustomBg: (dataUrl: string | null) => void
  setFloat: (on: boolean) => void
  resetSettings: () => void
  /** Resolved theme object (falls back to the first theme). */
  currentTheme: SalesTheme
  /**
   * True only on a light theme with NO custom background — a custom image
   * always gets a dark scrim, so the foreground stays in dark-mode colours.
   */
  isLight: boolean
}

const Ctx = createContext<SalesSettingsContextValue | null>(null)

export function SalesSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SalesSettings>(loadSettings)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      /* storage may be full / unavailable — fail silently */
    }
  }, [settings])

  const setLayout = useCallback(
    (layout: LayoutId) => setSettings((s) => ({ ...s, layout })),
    [],
  )
  const setThemeId = useCallback(
    (themeId: string) => setSettings((s) => ({ ...s, themeId })),
    [],
  )
  const setCustomBg = useCallback(
    (customBg: string | null) => setSettings((s) => ({ ...s, customBg })),
    [],
  )
  const setFloat = useCallback(
    (float: boolean) => setSettings((s) => ({ ...s, float })),
    [],
  )
  const resetSettings = useCallback(() => setSettings({ ...DEFAULTS }), [])

  const currentTheme = useMemo(
    () => THEMES.find((t) => t.id === settings.themeId) ?? THEMES[0],
    [settings.themeId],
  )

  const isLight = currentTheme.kind === 'light' && !settings.customBg

  const value: SalesSettingsContextValue = {
    ...settings,
    setLayout,
    setThemeId,
    setCustomBg,
    setFloat,
    resetSettings,
    currentTheme,
    isLight,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSalesSettings(): SalesSettingsContextValue {
  const ctx = useContext(Ctx)
  if (!ctx)
    throw new Error('useSalesSettings must be used within SalesSettingsProvider')
  return ctx
}
