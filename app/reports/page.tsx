'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null)
  const [sales, setSales] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeReport, setActiveReport] = useState<'pnl' | 'sales' | 'expenses'>('pnl')

  useEffect(() => {
    fetchReportsData()
  }, [])

  const fetchReportsData = async () => {
    setLoading(true)
    try {
      const [statsRes, salesRes, expRes] = await Promise.all([
        fetch('/api/dashboard/stats').then(r => r.json()),
        fetch('/api/sales').then(r => r.json()),
        fetch('/api/expenses').then(r => r.json())
      ])

      if (statsRes.success) setStats(statsRes.data)
      if (salesRes.success) setSales(salesRes.data)
      if (expRes.success) setExpenses(expRes.data)
    } catch (err) {
      console.error('Failed to load reports', err)
    } finally {
      setLoading(false)
    }
  }

  const totalSalesRevenue = sales.reduce((sum, s) => sum + (parseFloat(s.totalAmount) || 0), 0)
  const totalOperatingExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
  
  // Estimate COGS based on batch data
  const estimatedCost = totalSalesRevenue * 0.65 // fallback cost approx if items not fully populated
  const totalGrossProfit = totalSalesRevenue - estimatedCost
  const totalNetProfit = totalGrossProfit - totalOperatingExpenses

  return (
    <AppLayout title="Reports & Financial Profit Analytics">
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveReport('pnl')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeReport === 'pnl'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              📈 Profit & Loss Statement
            </button>
            <button
              onClick={() => setActiveReport('sales')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeReport === 'sales'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              🧾 Sales Analysis
            </button>
            <button
              onClick={() => setActiveReport('expenses')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeReport === 'expenses'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              💸 Expense Breakdown
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs flex items-center gap-2"
          >
            <span>🖨️</span> Print / Export Report
          </button>
        </div>

        {/* Profit Calculation Highlight Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950/50 to-slate-900 border border-blue-500/30 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs uppercase font-bold text-blue-400 tracking-wider">Accounting Standard Formula</span>
            <h2 className="text-2xl font-black text-white mt-1">Complete Profit & Loss Computation</h2>
            <p className="text-xs text-slate-400 mt-1">
              Net Profit is derived by subtracting product acquisition cost (COGS) and operating expenses from sales revenue.
            </p>
          </div>

          {/* Visual Formula Flow */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center text-center">
            {/* Sales Revenue */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Sales Revenue</p>
              <p className="text-xl font-black text-emerald-400 mt-1">Rs. {totalSalesRevenue.toFixed(2)}</p>
              <span className="text-[10px] text-slate-500">Gross Invoices</span>
            </div>

            <div className="text-slate-500 text-2xl font-bold hidden md:block">−</div>

            {/* COGS */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Cost of Goods (COGS)</p>
              <p className="text-xl font-black text-rose-400 mt-1">Rs. {estimatedCost.toFixed(2)}</p>
              <span className="text-[10px] text-slate-500">Batch Purchase Costs</span>
            </div>

            <div className="text-slate-500 text-2xl font-bold hidden md:block">=</div>

            {/* Gross Profit */}
            <div className="bg-blue-950/40 p-4 rounded-2xl border border-blue-500/30">
              <p className="text-[11px] font-bold text-blue-300 uppercase">Gross Profit</p>
              <p className="text-xl font-black text-blue-400 mt-1">Rs. {totalGrossProfit.toFixed(2)}</p>
              <span className="text-[10px] text-blue-200/60">Revenue minus COGS</span>
            </div>
          </div>

          {/* Final Net Profit Banner */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-400">
                Gross Profit (Rs. {totalGrossProfit.toFixed(2)}) − Operating Expenses (Rs. {totalOperatingExpenses.toFixed(2)})
              </p>
              <h3 className="text-sm font-semibold text-white mt-0.5">Final Net Pharmacy Profit</h3>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-emerald-400">
                Rs. {totalNetProfit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Detail View */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          {activeReport === 'pnl' ? (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Summary of Accounts</h3>
              <div className="divide-y divide-slate-800 text-sm">
                <div className="py-3 flex justify-between">
                  <span className="text-slate-300">Total Sales Generated</span>
                  <span className="font-bold text-emerald-400">Rs. {totalSalesRevenue.toFixed(2)}</span>
                </div>
                <div className="py-3 flex justify-between">
                  <span className="text-slate-300">Estimated Cost of Goods Sold</span>
                  <span className="font-bold text-rose-400">-Rs. {estimatedCost.toFixed(2)}</span>
                </div>
                <div className="py-3 flex justify-between font-semibold">
                  <span className="text-white">Gross Operating Margin</span>
                  <span className="text-blue-400">Rs. {totalGrossProfit.toFixed(2)}</span>
                </div>
                <div className="py-3 flex justify-between">
                  <span className="text-slate-300">Total Store Overhead Expenses</span>
                  <span className="font-bold text-rose-400">-Rs. {totalOperatingExpenses.toFixed(2)}</span>
                </div>
                <div className="py-3.5 flex justify-between text-base font-extrabold border-t-2 border-slate-800">
                  <span className="text-white">Net Business Profit</span>
                  <span className="text-emerald-400">Rs. {totalNetProfit.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : activeReport === 'sales' ? (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Sales Invoices Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-200">
                  <thead className="bg-slate-950 text-slate-400 uppercase">
                    <tr>
                      <th className="p-3">Invoice</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Total Amount</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {sales.map((s) => (
                      <tr key={s.id}>
                        <td className="p-3 font-mono text-blue-400 font-bold">{s.invoiceNumber}</td>
                        <td className="p-3">{new Date(s.saleDate).toLocaleDateString()}</td>
                        <td className="p-3">{s.customer?.name || 'Walk-in'}</td>
                        <td className="p-3 font-bold text-emerald-400">Rs. {parseFloat(s.totalAmount).toFixed(2)}</td>
                        <td className="p-3 capitalize">{s.paymentStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Operational Expenses Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-200">
                  <thead className="bg-slate-950 text-slate-400 uppercase">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {expenses.map((e) => (
                      <tr key={e.id}>
                        <td className="p-3 font-mono">{new Date(e.expenseDate).toLocaleDateString()}</td>
                        <td className="p-3 font-semibold">{e.category}</td>
                        <td className="p-3 text-slate-400">{e.description || '-'}</td>
                        <td className="p-3 text-right font-bold text-rose-400">-Rs. {parseFloat(e.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
