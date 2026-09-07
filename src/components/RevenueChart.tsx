import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ChartDataPoint {
  date: string
  revenue: number
  profit: number
}

interface RevenueChartProps {
  data?: ChartDataPoint[]
}

const DEFAULT_DATA: ChartDataPoint[] = [
  { date: 'Mon', revenue: 42000, profit: 11000 },
  { date: 'Tue', revenue: 58000, profit: 16500 },
  { date: 'Wed', revenue: 51000, profit: 14200 },
  { date: 'Thu', revenue: 73000, profit: 21500 },
  { date: 'Fri', revenue: 89000, profit: 26000 },
  { date: 'Sat', revenue: 95000, profit: 29000 },
  { date: 'Sun', revenue: 64000, profit: 18500 },
]

export const RevenueChart: React.FC<RevenueChartProps> = ({ data = DEFAULT_DATA }) => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
          <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `Rs.${val / 1000}k`} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '12px',
              color: '#f8fafc',
              fontSize: '12px',
            }}
            formatter={(val: any) => [`Rs. ${Number(val).toLocaleString()}`, '']}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#3b82f6"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#revenueGradient)"
            name="Revenue"
          />
          <Area
            type="monotone"
            dataKey="profit"
            stroke="#10b981"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#profitGradient)"
            name="Gross Profit"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
export default RevenueChart
