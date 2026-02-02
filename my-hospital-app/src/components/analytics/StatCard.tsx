'use client'

export default function StatCard({
  label,
  value,
  icon,
  gradient = 'from-cyan-500/20 to-blue-500/20',
  className,
}: {
  label: string
  value: string | number
  icon?: React.ReactNode
  gradient?: string
  className?: string
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} border border-slate-700 rounded-xl p-4 sm:p-6 shadow-lg ${className || ''}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs sm:text-sm font-semibold text-slate-200">{label}</p>
        {icon}
      </div>
      <p className="text-2xl sm:text-3xl font-extrabold text-white">{value}</p>
    </div>
  )
}
