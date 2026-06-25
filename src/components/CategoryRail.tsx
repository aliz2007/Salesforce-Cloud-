import { motion } from 'framer-motion'
import clsx from 'clsx'
import { LayoutGrid } from 'lucide-react'
import type { CategoryId } from '../types'
import { CATEGORIES } from '../data/categories'

export type CategoryFilter = CategoryId | 'all'

export default function CategoryRail({
  counts,
  active,
  onChange,
}: {
  counts: Record<string, number>
  active: CategoryFilter
  onChange: (c: CategoryFilter) => void
}) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      <Pill
        active={active === 'all'}
        onClick={() => onChange('all')}
        label="Tous"
        count={total}
        icon={<LayoutGrid className="h-4 w-4" />}
      />
      {CATEGORIES.map((c) => {
        const Icon = c.icon
        return (
          <Pill
            key={c.id}
            active={active === c.id}
            onClick={() => onChange(c.id)}
            label={c.label}
            count={counts[c.id] || 0}
            color={c.from}
            icon={<Icon className="h-4 w-4" />}
          />
        )
      })}
    </div>
  )
}

function Pill({
  active,
  onClick,
  label,
  count,
  color,
  icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  color?: string
  icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
        active
          ? 'border-transparent text-white'
          : 'border-mg-line bg-white text-mg-ink-soft hover:border-mg-ink/25 hover:text-mg-ink',
      )}
    >
      {active && (
        <motion.div
          layoutId="catRailActive"
          className="absolute inset-0 rounded-full bg-mg-ink"
          transition={{ type: 'spring', stiffness: 500, damping: 36 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        <span style={!active && color ? { color } : undefined} className="flex items-center">
          {icon}
        </span>
        {label}
      </span>
      <span
        className={clsx(
          'relative z-10 rounded-full px-1.5 text-xs tabular-nums',
          active ? 'bg-white/20 text-white' : 'bg-mg-wash text-mg-mute',
        )}
      >
        {count}
      </span>
    </button>
  )
}
