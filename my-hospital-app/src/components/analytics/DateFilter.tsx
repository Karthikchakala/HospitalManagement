'use client'

import { useEffect, useMemo, useState } from 'react'

type Period = 'day' | 'week' | 'month' | 'year' | 'custom'

export interface DateFilterValue {
  period: Period
  from?: string
  to?: string
}

export default function DateFilter({
  initial,
  onApply,
  className,
}: {
  initial?: DateFilterValue
  onApply: (v: DateFilterValue) => void
  className?: string
}) {
  const [period, setPeriod] = useState<Period>(initial?.period || 'month')
  const [from, setFrom] = useState<string>(initial?.from || '')
  const [to, setTo] = useState<string>(initial?.to || '')

  useEffect(() => {
    if (period !== 'custom') {
      onApply({ period })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const canApply = useMemo(() => {
    return period !== 'custom' || (!!from && !!to)
  }, [period, from, to])

  return (
    <div className={`flex flex-col sm:flex-row items-stretch sm:items-end gap-3 ${className || ''}`}>
      <div className="flex flex-col">
        <label className="text-xs text-gray-300 mb-1">Period</label>
        <select
          className="bg-slate-800 border border-slate-600 text-gray-100 rounded-md px-3 py-2"
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
        >
          <option value="day">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      {period === 'custom' && (
        <>
          <div className="flex flex-col">
            <label className="text-xs text-gray-300 mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="bg-slate-800 border border-slate-600 text-gray-100 rounded-md px-3 py-2"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-300 mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="bg-slate-800 border border-slate-600 text-gray-100 rounded-md px-3 py-2"
            />
          </div>
          <button
            disabled={!canApply}
            onClick={() => canApply && onApply({ period, from, to })}
            className="self-start sm:self-end mt-5 px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-60"
          >
            Apply
          </button>
        </>
      )}
    </div>
  )
}
