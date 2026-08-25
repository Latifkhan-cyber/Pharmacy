'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'

interface Payment {
  id: string
  paymentDate: string
  amount: number
  paymentMethod: string
  paymentType: 'customer' | 'supplier'
  notes?: string
  customer?: { name: string; phone: string }
  supplier?: { name: string }
  user?: { fullName: string }
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/payments')
      const data = await res.json()
      if (data.success) {
        setPayments(data.data)
      }
    } catch (err) {
      console.error('Error fetching payments', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = payments.filter(p =>
    typeFilter === 'all' || p.paymentType === typeFilter
  )

  const totalCustomerCollections = payments
    .filter(p => p.paymentType === 'customer')
    .reduce((sum, p) => sum + (parseFloat(p.amount.toString()) || 0), 0)

  const totalSupplierPayouts = payments
    .filter(p => p.paymentType === 'supplier')
    .reduce((sum, p) => sum + (parseFloat(p.amount.toString()) || 0), 0)

  return (
    <AppLayout title="Payments & Collections Ledger">
      <div className="space-y-6">
        {/* KPI Summaries */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Transactions</p>
            <h4 className="text-2xl font-bold text-white mt-1">{payments.length}</h4>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl">
            <p className="text-xs font-semibold text-emerald-400 uppercase">Customer Collections (Incoming)</p>
            <h4 className="text-2xl font-extrabold text-emerald-300 mt-1">+Rs. {totalCustomerCollections.toFixed(2)}</h4>
          </div>

          <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-2xl">
            <p className="text-xs font-semibold text-rose-400 uppercase">Supplier Payouts (Outgoing)</p>
            <h4 className="text-2xl font-extrabold text-rose-300 mt-1">-Rs. {totalSupplierPayouts.toFixed(2)}</h4>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex gap-2">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                typeFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Payments
            </button>
            <button
              onClick={() => setTypeFilter('customer')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                typeFilter === 'customer'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Customer Collections
            </button>
            <button
              onClick={() => setTypeFilter('supplier')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                typeFilter === 'supplier'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Supplier Payouts
            </button>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Party / Entity</th>
                  <th className="px-5 py-3.5">Method</th>
                  <th className="px-5 py-3.5">Notes</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">Loading ledger records...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">No payment records found.</td>
                  </tr>
                ) : (
                  filtered.map((p) => {
                    const isCustomer = p.paymentType === 'customer'
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-4 text-xs font-mono text-slate-400">
                          {new Date(p.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                              isCustomer
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {isCustomer ? 'Received' : 'Paid Out'}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-white">
                          {isCustomer ? p.customer?.name || 'Walk-in Customer' : p.supplier?.name || 'Vendor'}
                        </td>
                        <td className="px-5 py-4 text-xs capitalize text-slate-300">
                          {p.paymentMethod}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-400">
                          {p.notes || '-'}
                        </td>
                        <td
                          className={`px-5 py-4 text-right font-extrabold text-base ${
                            isCustomer ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isCustomer ? '+' : '-'}Rs. {parseFloat(p.amount.toString()).toFixed(2)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
