import React, { useState, useEffect } from 'react'
import {
  Wallet,
  Search,
  Calendar,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { fetchPayments } from '../services/paymentService'
import { Payment } from '../types'

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'supplier'>('all')

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchPayments()
      setPayments(data)
    } catch (err) {
      console.error('Error fetching payments:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = payments.filter((p) => {
    const matchesSearch =
      !searchQuery.trim() ||
      (p.customerName && p.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.supplierName && p.supplierName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false
    if (filterType === 'customer') return p.paymentType === 'customer'
    if (filterType === 'supplier') return p.paymentType === 'supplier'
    return true
  })

  const customerInflow = payments
    .filter((p) => p.paymentType === 'customer')
    .reduce((s, p) => s + Number(p.amount || 0), 0)

  const supplierOutflow = payments
    .filter((p) => p.paymentType === 'supplier')
    .reduce((s, p) => s + Number(p.amount || 0), 0)

  return (
    <AppLayout title="Payments & Settlement Ledger">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-400" />
              Unified Payments & Cash Ledger
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Audit trail of all customer collections and supplier settlement payouts
            </p>
          </div>

          <button
            onClick={loadData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition-all self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Inflow vs Outflow Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Customer Inflows (Collected)
              </span>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                Rs. {customerInflow.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Supplier Outflows (Paid Out)
              </span>
              <p className="text-2xl font-black text-red-400 mt-1">
                Rs. {supplierOutflow.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col sm:flex-row gap-3 items-center justify-between shadow-lg">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by party name or channel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Payments
            </button>
            <button
              onClick={() => setFilterType('customer')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                filterType === 'customer'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Customer Inflows
            </button>
            <button
              onClick={() => setFilterType('supplier')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                filterType === 'supplier'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Supplier Payouts
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Date & Time</th>
                  <th className="py-3.5 px-4 font-bold">Type</th>
                  <th className="py-3.5 px-4 font-bold">Party / Account</th>
                  <th className="py-3.5 px-4 font-bold">Channel</th>
                  <th className="py-3.5 px-4 font-bold">Notes</th>
                  <th className="py-3.5 px-4 font-bold text-right">Amount (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-500">
                      Loading payment logs...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-500">
                      No payment records found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-all">
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(p.paymentDate).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            p.paymentType === 'customer'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {p.paymentType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        {p.paymentType === 'customer'
                          ? p.customerName || 'Customer'
                          : p.supplierName || 'Supplier'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold uppercase text-[10px]">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 truncate max-w-[200px]">
                        {p.notes || '—'}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-black text-sm ${
                          p.paymentType === 'customer' ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {p.paymentType === 'customer' ? '+' : '-'}Rs. {Number(p.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
