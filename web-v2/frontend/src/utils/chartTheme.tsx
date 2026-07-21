/**
 * Shared Recharts theming — Charcoal & Chartreuse palette.
 * Reads CSS variables at render time so theme switches propagate instantly.
 */

function readVar(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  return value || fallback
}

/** Tooltip surface — uses card tokens, always current theme. */
export const chartTooltipStyle = () => {
  const card   = readVar('--color-card-solid', '#1A1A1A')
  const fg     = readVar('--color-fg', '#F2F2ED')
  const border = readVar('--color-border-strong', '#3A3A3A')
  return {
    background:   card,
    border:       `1px solid ${border}`,
    borderRadius: '10px',
    color:        fg,
    boxShadow:    '0 8px 24px rgba(0,0,0,0.4)',
    padding:      '10px 14px',
    fontSize:     '12px',
  } as const
}

export const chartGridStroke  = () => readVar('--color-border',        '#2C2C2C')
export const chartAxisStroke  = () => readVar('--color-border-strong', '#3A3A3A')
export const chartTickColor   = () => readVar('--color-muted',         '#A3A39C')
export const chartCursorFill  = () => 'rgba(200, 200, 190, 0.07)'

/** Series palette — neutral ink for base, chartreuse for primary callout only. */
export const chartColors = {
  chartreuse: '#C6FF00',   // primary accent — most important series
  chartreuseLight: '#A8D400',
  ink:    '#5C5C57',       // base/secondary series (dark)
  inkMid: '#8A8A82',       // tertiary / supporting
  inkLight: '#B8B8AE',     // subtle fill
  success: '#2FE86A',
  danger:  '#FF4569',
} as const

/** Gradient fills for Recharts <defs> */
export const chartGradients = (
  <>
    {/* Primary — chartreuse. Use for the #1 attention metric. */}
    <linearGradient id="gradChartreuse" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stopColor="#C6FF00" />
      <stop offset="100%" stopColor="#A8D400" />
    </linearGradient>

    {/* Secondary — ink / neutral. Use for base/comparison series. */}
    <linearGradient id="gradInk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stopColor="#8A8A82" />
      <stop offset="100%" stopColor="#5C5C57" />
    </linearGradient>

    {/* Success — in-stock indicator */}
    <linearGradient id="gradSuccess" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stopColor="#2FE86A" />
      <stop offset="100%" stopColor="#00C853" />
    </linearGradient>

    {/* Danger — out-of-stock / critical */}
    <linearGradient id="gradDanger" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stopColor="#FF4569" />
      <stop offset="100%" stopColor="#FF1744" />
    </linearGradient>
  </>
)

export const fillFor = (id: string) => `url(#${id})`
