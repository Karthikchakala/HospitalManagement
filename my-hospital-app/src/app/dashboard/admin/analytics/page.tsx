'use client'

import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import DashboardNavbar from '../../../../components/DashboardNavbar'
import DateFilter, { DateFilterValue } from '../../../../components/analytics/DateFilter'
import ChartCard from '../../../../components/analytics/ChartCard'
import StatCard from '../../../../components/analytics/StatCard'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, AreaChart, Area
} from 'recharts'

const adminNavLinks = [
  { name: 'Home', href: '/' },
  { name: 'Dashboard', href: '/dashboard/admin' },
  { name: 'Analytics', href: '/dashboard/admin/analytics' },
  { name: 'Users', href: '/dashboard/admin/doctors' },
  { name: 'Settings', href: '/dashboard/admin/settings' },
]

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:5000'

type Tab = 'revenue' | 'department' | 'doctor' | 'staff'

export default function AdminAnalyticsPage() {
  const [userName, setUserName] = useState('Admin')
  const [active, setActive] = useState<Tab>('revenue')
  const [df, setDf] = useState<DateFilterValue>({ period: 'month' })
  const [loading, setLoading] = useState(false)

  // Data stores
  const [revenueData, setRevenueData] = useState<any | null>(null)
  const [deptData, setDeptData] = useState<any | null>(null)
  const [doctorData, setDoctorData] = useState<any | null>(null)
  const [staffData, setStaffData] = useState<any | null>(null)
  const [staffRole, setStaffRole] = useState<'receptionists'|'pharmacists'|'laboratorists'|'all'>('all')

  const queryParams = useMemo(() => {
    if (df.period === 'custom' && df.from && df.to) {
      return { range: `${df.from}_to_${df.to}` }
    }
    return { period: df.period }
  }, [df])

  const tokenHeader = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  // Profile name load (optional)
  useEffect(() => {
    (async () => {
      try {
        const resp = await axios.get(`${API_BASE}/api/admin/profile`, { headers: tokenHeader() })
        setUserName(resp.data?.name || 'Admin')
      } catch {}
    })()
  }, [])

  // Fetch by tab
  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        if (active === 'revenue') {
          const resp = await axios.get(`${API_BASE}/api/admin/analytics/revenue`, { params: queryParams, headers: tokenHeader() })
          setRevenueData(resp.data)
        } else if (active === 'department') {
          const resp = await axios.get(`${API_BASE}/api/admin/analytics/patients/department`, { params: queryParams, headers: tokenHeader() })
          setDeptData(resp.data)
        } else if (active === 'doctor') {
          const resp = await axios.get(`${API_BASE}/api/admin/analytics/patients/doctor`, { params: queryParams, headers: tokenHeader() })
          setDoctorData(resp.data)
        } else if (active === 'staff') {
          const params = { ...queryParams, role: staffRole === 'all' ? undefined : staffRole }
          const resp = await axios.get(`${API_BASE}/api/admin/analytics/staff/performance`, { params, headers: tokenHeader() })
          setStaffData(resp.data)
        }
      } finally {
        setLoading(false)
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, JSON.stringify(queryParams), staffRole])

  const COLORS = ['#22d3ee','#60a5fa','#34d399','#f97316','#a78bfa','#f472b6','#facc15']

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-gray-100">
      <DashboardNavbar title="Admin Analytics" navLinks={adminNavLinks} userName={userName} />
      <main className="container mx-auto pt-24 px-4 sm:px-6 lg:px-8 pb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-cyan-300 mb-6">Analytics</h1>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {([
            { key: 'revenue', label: 'Revenue' },
            { key: 'department', label: 'Department Analytics' },
            { key: 'doctor', label: 'Doctor Analytics' },
            { key: 'staff', label: 'Staff Performance' },
          ] as Array<{key:Tab,label:string}>).map(t => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`px-4 py-2 rounded-md border ${active===t.key? 'bg-cyan-600 border-cyan-400':'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
            >{t.label}</button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <DateFilter initial={df} onApply={setDf} />
          {active==='staff' && (
            <div className="flex items-end gap-3">
              <div className="flex flex-col">
                <label className="text-xs text-gray-300 mb-1">Staff Role</label>
                <select
                  className="bg-slate-800 border border-slate-600 text-gray-100 rounded-md px-3 py-2"
                  value={staffRole}
                  onChange={(e)=> setStaffRole(e.target.value as any)}
                >
                  <option value="all">All</option>
                  <option value="receptionists">Receptionists</option>
                  <option value="pharmacists">Pharmacists</option>
                  <option value="laboratorists">Laboratorists</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="w-full flex justify-center items-center py-10">
            <div className="h-10 w-10 rounded-full border-2 border-slate-700 border-t-cyan-400 animate-spin" />
          </div>
        )}

        {!loading && active==='revenue' && revenueData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <StatCard label="Total Revenue" value={`₹${(revenueData.totalRevenue||0).toLocaleString()}`} className="lg:col-span-3" />

            <ChartCard title="Revenue by Department" subtitle="Bar Chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData.byDepartment || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="label" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid #334155', color:'#e5e7eb' }} />
                  <Legend />
                  <Bar dataKey="value" name="Revenue" fill="#22d3ee" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Revenue Trend" subtitle="Line Chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData.trend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid #334155', color:'#e5e7eb' }} />
                  <Legend />
                  <Line type="monotone" dataKey="value" name="Revenue" stroke="#60a5fa" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Department Share" subtitle="Pie Chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid #334155', color:'#e5e7eb' }} />
                  <Legend />
                  <Pie data={revenueData.share || []} dataKey="value" nameKey="label" innerRadius={50} outerRadius={90}>
                    {(revenueData.share || []).map((_:any, idx:number) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {!loading && active==='department' && deptData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Patients per Department" subtitle="Bar Chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData.byDepartment || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="label" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid #334155', color:'#e5e7eb' }} />
                  <Legend />
                  <Bar dataKey="value" name="Patients" fill="#34d399" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Patient Trend" subtitle="Line Chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={deptData.trend || []}>
                  <defs>
                    <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid #334155', color:'#e5e7eb' }} />
                  <Legend />
                  <Area type="monotone" dataKey="value" name="Patients" stroke="#22d3ee" fill="url(#grad1)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {!loading && active==='doctor' && doctorData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Patients per Doctor" subtitle="Bar Chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={doctorData.byDoctor || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="label" hide />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid #334155', color:'#e5e7eb' }} />
                  <Legend />
                  <Bar dataKey="value" name="Patients" fill="#a78bfa" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <div className="space-y-6">
              <ChartCard title="Daily Trend" subtitle="Line Chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={doctorData.trend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid #334155', color:'#e5e7eb' }} />
                    <Legend />
                    <Line type="monotone" dataKey="value" name="Patients" stroke="#f97316" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 sm:p-6 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg sm:text-xl font-semibold text-white">Top 10 Busiest Doctors</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-slate-300">
                        <th className="py-2 pr-3">Doctor</th>
                        <th className="py-2 pr-3">Patients</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(doctorData.top10||[]).map((row:any, idx:number)=> (
                        <tr key={idx} className="border-t border-slate-700/60">
                          <td className="py-2 pr-3">{row.label}</td>
                          <td className="py-2 pr-3">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && active==='staff' && staffData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Category Contribution" subtitle="Pie Chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid #334155', color:'#e5e7eb' }} />
                  <Legend />
                  <Pie data={(staffData.categories||[]).map((c:any)=>({ label:c.label, value: Object.values(c.metrics||{}).reduce((s:any,v:any)=> s + (typeof v==='number'? v : 0),0) }))} dataKey="value" nameKey="label" innerRadius={50} outerRadius={90}>
                    {(staffData.categories||[]).map((_:any, idx:number) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Month-wise Activity (proxy)" subtitle="Bar Chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(staffData.categories||[]).map((c:any)=>({ label:c.label, value: Object.values(c.metrics||{}).reduce((s:any,v:any)=> s + (typeof v==='number'? v : 0),0) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="label" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid #334155', color:'#e5e7eb' }} />
                  <Legend />
                  <Bar dataKey="value" name="Activity" fill="#f472b6" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}
      </main>
    </div>
  )
}
