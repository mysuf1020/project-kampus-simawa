export type PublicPageThemeKey = keyof typeof PUBLIC_PAGE_THEMES

export const PUBLIC_PAGE_THEMES = {
  emerald: {
    label: 'Emerald',
    pageGradient: 'from-neutral-950 via-[#0b1b1f] to-neutral-900',
    pageRadial:
      'bg-[radial-gradient(circle_at_10%_20%,rgba(0,255,179,0.08),transparent_25%),radial-gradient(circle_at_90%_10%,rgba(14,165,233,0.08),transparent_30%),radial-gradient(circle_at_30%_80%,rgba(52,211,153,0.06),transparent_25%)]',
    pageLinear: 'bg-[linear-gradient(135deg,rgba(15,118,110,0.1),rgba(17,24,39,0.6))]',
    heroGradient: 'from-main-800 via-main-700 to-emerald-500',
  },
  ocean: {
    label: 'Ocean',
    pageGradient: 'from-neutral-950 via-[#081526] to-neutral-900',
    pageRadial:
      'bg-[radial-gradient(circle_at_10%_20%,rgba(56,189,248,0.1),transparent_25%),radial-gradient(circle_at_90%_10%,rgba(34,211,238,0.08),transparent_30%),radial-gradient(circle_at_30%_80%,rgba(99,102,241,0.06),transparent_25%)]',
    pageLinear: 'bg-[linear-gradient(135deg,rgba(2,132,199,0.12),rgba(17,24,39,0.62))]',
    heroGradient: 'from-sky-800 via-cyan-700 to-blue-600',
  },
  sunset: {
    label: 'Sunset',
    pageGradient: 'from-neutral-950 via-[#231006] to-neutral-900',
    pageRadial:
      'bg-[radial-gradient(circle_at_10%_20%,rgba(251,146,60,0.12),transparent_25%),radial-gradient(circle_at_90%_10%,rgba(244,63,94,0.1),transparent_32%),radial-gradient(circle_at_30%_80%,rgba(250,204,21,0.06),transparent_25%)]',
    pageLinear: 'bg-[linear-gradient(135deg,rgba(234,88,12,0.12),rgba(17,24,39,0.62))]',
    heroGradient: 'from-amber-700 via-orange-600 to-rose-600',
  },
  midnight: {
    label: 'Midnight',
    pageGradient: 'from-neutral-950 via-[#0b1024] to-neutral-900',
    pageRadial:
      'bg-[radial-gradient(circle_at_10%_20%,rgba(99,102,241,0.1),transparent_25%),radial-gradient(circle_at_90%_10%,rgba(168,85,247,0.08),transparent_30%),radial-gradient(circle_at_30%_80%,rgba(59,130,246,0.06),transparent_25%)]',
    pageLinear: 'bg-[linear-gradient(135deg,rgba(79,70,229,0.12),rgba(17,24,39,0.62))]',
    heroGradient: 'from-indigo-800 via-violet-700 to-blue-700',
  },
} as const

export type ShowcaseAccentKey = keyof typeof SHOWCASE_ACCENTS

export const SHOWCASE_ACCENTS = {
  emerald: 'from-emerald-500/60 to-main-700/60',
  amber: 'from-amber-400/50 to-main-700/60',
  sky: 'from-sky-400/50 to-main-700/60',
  violet: 'from-violet-400/50 to-main-700/60',
  rose: 'from-rose-400/50 to-main-700/60',
  slate: 'from-slate-400/40 to-main-700/60',
} as const

export type OrgPublicPageShowcaseOverride = {
  id: string
  title?: string
  body?: string
  accent?: ShowcaseAccentKey
  href?: string
  cta_label?: string
  enabled?: boolean
}

export type OrgPublicPageLinkOverrides = {
  version?: number
  theme?: PublicPageThemeKey
  showcase?: OrgPublicPageShowcaseOverride[]
}

export type OrgPublicPageShowcaseBlock = {
  id: string
  title: string
  body: string
  accent: ShowcaseAccentKey
  enabled: boolean
  href?: string
  cta_label?: string
}

export type OrgPublicPageConfig = {
  theme: PublicPageThemeKey
  showcase: OrgPublicPageShowcaseBlock[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const normalizeTheme = (value: unknown): PublicPageThemeKey | undefined => {
  if (typeof value !== 'string') return undefined
  if (value in PUBLIC_PAGE_THEMES) return value as PublicPageThemeKey
  return undefined
}

const normalizeAccent = (value: unknown): ShowcaseAccentKey | undefined => {
  if (typeof value !== 'string') return undefined
  if (value in SHOWCASE_ACCENTS) return value as ShowcaseAccentKey
  return undefined
}

const normalizeText = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const normalizeHref = (value: unknown): string | undefined => {
  const href = normalizeText(value)
  if (!href) return undefined
  if (href.startsWith('/') || href.startsWith('#')) return href

  try {
    const parsed = new URL(href)
    if (['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
      return href
    }
  } catch {
    return undefined
  }

  return undefined
}

const normalizeShowcaseOverride = (
  value: unknown,
): OrgPublicPageShowcaseOverride | null => {
  if (!isRecord(value)) return null
  const id = normalizeText(value.id)
  if (!id) return null

  const title = normalizeText(value.title)
  const body = normalizeText(value.body)
  const accent = normalizeAccent(value.accent)
  const href = normalizeHref(value.href)
  const cta_label = normalizeText(value.cta_label)
  const enabled = typeof value.enabled === 'boolean' ? value.enabled : undefined

  return {
    id,
    ...(title ? { title } : {}),
    ...(body ? { body } : {}),
    ...(accent ? { accent } : {}),
    ...(href ? { href } : {}),
    ...(cta_label ? { cta_label } : {}),
    ...(typeof enabled === 'boolean' ? { enabled } : {}),
  }
}

export const readOrgPublicPageOverrides = (
  links: unknown,
): OrgPublicPageLinkOverrides | null => {
  if (!isRecord(links)) return null
  const raw = links.public_page
  if (!isRecord(raw)) return null

  const theme = normalizeTheme(raw.theme)
  const showcaseRaw = raw.showcase
  const showcase = Array.isArray(showcaseRaw)
    ? (showcaseRaw
        .map(normalizeShowcaseOverride)
        .filter((item): item is OrgPublicPageShowcaseOverride =>
          Boolean(item),
        ) as OrgPublicPageShowcaseOverride[])
    : undefined

  const version = typeof raw.version === 'number' ? raw.version : undefined

  return {
    ...(typeof version === 'number' ? { version } : {}),
    ...(theme ? { theme } : {}),
    ...(showcase ? { showcase } : {}),
  }
}

const buildDefaultShowcase = (contactEmail: string): OrgPublicPageShowcaseBlock[] => [
  {
    id: 'program',
    title: 'Program unggulan',
    body: 'Soroti program utama, pencapaian, atau layanan kunci organisasi.',
    accent: 'emerald',
    enabled: true,
  },
  {
    id: 'partners',
    title: 'Kolaborasi & partner',
    body: 'Tampilkan mitra, sponsor, atau kolaborator utama untuk menambah kredibilitas.',
    accent: 'amber',
    enabled: true,
  },
  {
    id: 'contact',
    title: 'Hubungi & media',
    body: `Gunakan email ${contactEmail} atau lengkapi kanal lain (website, Instagram).`,
    accent: 'sky',
    enabled: true,
  },
]

export const normalizeOrgPublicPageConfig = ({
  links,
  contactEmail,
}: {
  links?: unknown
  contactEmail?: string
}): OrgPublicPageConfig => {
  const overrides = readOrgPublicPageOverrides(links)
  const theme: PublicPageThemeKey = overrides?.theme ?? 'emerald'

  const fallbackEmail = contactEmail?.trim() || 'halo@simawa.local'
  const defaults = buildDefaultShowcase(fallbackEmail)
  const defaultsById = new Map(defaults.map((item) => [item.id, item]))

  if ((overrides?.version ?? 1) >= 2 && Array.isArray(overrides?.showcase)) {
    const showcase = (overrides.showcase ?? [])
      .map((item) => {
        const base = defaultsById.get(item.id)
        const title = item.title ?? base?.title ?? item.id
        const body = item.body ?? base?.body ?? ''
        const accent = item.accent ?? base?.accent ?? 'slate'
        const enabled = typeof item.enabled === 'boolean' ? item.enabled : true

        return {
          id: item.id,
          title,
          body,
          accent,
          enabled,
          ...(item.href ? { href: item.href } : {}),
          ...(item.cta_label ? { cta_label: item.cta_label } : {}),
        }
      })
      .filter((item) => item.title.trim().length > 0 && item.body.trim().length > 0)

    return { theme, showcase }
  }

  const byId = new Map((overrides?.showcase ?? []).map((item) => [item.id, item]))
  const merged = defaults.map((item) => {
    const override = byId.get(item.id)
    return {
      ...item,
      ...(override?.title ? { title: override.title } : {}),
      ...(override?.body ? { body: override.body } : {}),
      ...(override?.accent ? { accent: override.accent } : {}),
      ...(override?.href ? { href: override.href } : {}),
      ...(override?.cta_label ? { cta_label: override.cta_label } : {}),
      ...(typeof override?.enabled === 'boolean' ? { enabled: override.enabled } : {}),
    }
  })

  const extra = (overrides?.showcase ?? [])
    .filter((item) => !defaults.some((d) => d.id === item.id))
    .map((item) => ({
      id: item.id,
      title: item.title ?? item.id,
      body: item.body ?? '',
      accent: item.accent ?? 'slate',
      enabled: item.enabled ?? true,
      ...(item.href ? { href: item.href } : {}),
      ...(item.cta_label ? { cta_label: item.cta_label } : {}),
    }))
    .filter((item) => item.title.trim().length > 0 && item.body.trim().length > 0)

  return {
    theme,
    showcase: [...merged, ...extra],
  }
}
