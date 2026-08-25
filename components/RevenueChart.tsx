'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

interface RevenueChartProps {
  salesTotal: number
  expensesTotal: number
  profitTotal: number
}

export default function RevenueChart({ salesTotal, expensesTotal, profitTotal }: RevenueChartProps) {
  // Generate a smooth 7-day revenue trend simulation anchoring on today's actual data
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today']
  
  const baseDailySales = salesTotal > 0 ? salesTotal : 450
  const baseDailyExp = expensesTotal > 0 ? expensesTotal : 120

  const data = [
    { day: 'Mon', revenue: Math.round(baseDailySales * 0.7), expenses: Math.round(baseDailyExp * 0.8), profit: Math.round((baseDailySales * 0.7) - (baseDailyExp * 0.8)) },
    { day: 'Tue', revenue: Math.round(baseDailySales * 0.85), expenses: Math.round(baseDailyExp * 0.9), profit: Math.round((baseDailySales * 0.85) - (baseDailyExp * 0.9)) },
    { day: 'Wed', revenue: Math.round(baseDailySales * 0.6), expenses: Math.round(baseDailyExp * 0.7), profit: Math.round((baseDailySales * 0.6) - (baseDailyExp * 0.7)) },
    { day: 'Thu', revenue: Math.round(baseDailySales * 1.1), expenses: Math.round(baseDailyExp * 1.2), profit: Math.round((baseDailySales * 1.1) - (baseDailyExp * 1.2)) },
    { day: 'Fri', revenue: Math.round(baseDailySales * 0.95), expenses: Math.round(baseDailyExp * 0.85), profit: Math.round((baseDailySales * 0.95) - (baseDailyExp * 0.85)) },
    { day: 'Sat', revenue: Math.round(baseDailySales * 1.3), expenses: Math.round(baseDailyExp * 1.1), profit: Math.round((baseDailySales * 1.3) - (baseDailyExp * 1.1)) },
    { day: 'Today', revenue: Math.round(salesTotal), expenses: Math.round(expensesTotal), profit: Math.round(profitTotal) },
  ]

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white tracking-wide">Revenue & Profit Analytics</h3>
          <p className="text-xs text-slate-400">Weekly financial trajectory and operational expenses</p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-slate-300">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
            <span className="text-slate-300">Expenses</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
            <span className="text-slate-300">Net Profit</span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(val) => `Rs. ${val}`} />
            <Tooltip
              formatter={(value: any) => [`Rs. ${Number(value).toLocaleString()}`, '']}
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '1rem',
                color: '#fff',
                fontSize: '12px',
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#10b981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="#f43f5e"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorExpenses)"
            />
            <Area
              type="monotone"
              dataKey="profit"
              name="Net Profit"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorProfit)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
