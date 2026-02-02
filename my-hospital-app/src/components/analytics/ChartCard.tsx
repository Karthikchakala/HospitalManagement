'use client'

export default function ChartCard({
  title,
  subtitle,
  right,
  children,
  className,
}: {
  title: string
  subtitle?: string
  right?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`bg-slate-800/70 border border-slate-700 rounded-xl p-4 sm:p-6 shadow-lg ${className || ''}`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-xs sm:text-sm text-slate-300 mt-0.5">{subtitle}</p>}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      <div className="h-[260px] sm:h-[320px]">
        {children}
      </div>
    </div>
  )
}
