'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedSale, setSelectedSale] = useState<any | null>(null)

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sales')
      const data = await res.json()
      if (data.success) {
        setSales(data.data)
      }
    } catch (err) {
      console.error('Failed to load sales', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredSales = sales.filter(s => {
    const matchesSearch =
      s.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.customer?.phone?.includes(search)
    const matchesStatus = statusFilter === 'all' || s.paymentStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <AppLayout title="Sales & Invoice History">
      <div className="space-y-6">
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex flex-1 items-center gap-3">
            <input
              type="text"
              placeholder="🔍 Search by Invoice #, Customer name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 max-w-md px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Payment Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <Link
            href="/pos"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
          >
            <span>+</span> New Sale (POS)
          </Link>
        </div>

        {/* Sales Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">Loading sales history...</td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">No invoices found.</td>
                  </tr>
                ) : (
                  filteredSales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-blue-400 text-sm">
                        {s.invoiceNumber}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400">
                        {new Date(s.saleDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-white">{s.customer?.name || 'Walk-in Customer'}</span>
                        {s.customer?.phone && (
                          <span className="block text-xs text-slate-500">{s.customer.phone}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-bold text-emerald-400 text-sm">
                        Rs. {parseFloat(s.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                              s.paymentStatus === 'paid'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : s.paymentStatus === 'partial'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {s.paymentStatus}
                          </span>
                          <span className="text-[11px] text-slate-500 capitalize font-mono">
                            via {s.paymentMethod}
                          </span>
                        </div>
                        {parseFloat(s.dueAmount) > 0 && (
                          <span className="text-[10px] text-purple-400 block mt-0.5">
                            Due: Rs. {parseFloat(s.dueAmount).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedSale(s)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all"
                        >
                          View Invoice
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-xl w-full text-white space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white">Invoice Details</h3>
                <p className="text-xs text-blue-400 font-mono">{selectedSale.invoiceNumber}</p>
              </div>
              <button onClick={() => setSelectedSale(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-3 font-mono">
              <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400">
                <div>
                  <p className="text-white font-bold">Customer: {selectedSale.customer?.name || 'Walk-in'}</p>
                  <p>Date: {new Date(selectedSale.saleDate).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="capitalize">Method: {selectedSale.paymentMethod}</p>
                  <p className="capitalize text-emerald-400 font-bold">Status: {selectedSale.paymentStatus}</p>
                </div>
              </div>

              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-1.5">Item</th>
                    <th className="pb-1.5 text-center">Batch</th>
                    <th className="pb-1.5 text-center">Qty</th>
                    <th className="pb-1.5 text-right">Price</th>
                    <th className="pb-1.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {selectedSale.items?.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-1 text-white font-sans">{item.medicine?.name || 'Item'}</td>
                      <td className="py-1 text-center text-blue-400">{item.batchNumber || '-'}</td>
                      <td className="py-1 text-center text-slate-300">{item.quantity}</td>
                      <td className="py-1 text-right text-slate-300">Rs. {parseFloat(item.salePrice).toFixed(2)}</td>
                      <td className="py-1 text-right text-emerald-400 font-bold">Rs. {parseFloat(item.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-slate-800 pt-2 space-y-1 text-right">
                <p className="text-slate-400">Subtotal: <span className="text-white">Rs. {parseFloat(selectedSale.subtotal).toFixed(2)}</span></p>
                {parseFloat(selectedSale.tax) > 0 && (
                  <p className="text-slate-400">Tax: <span className="text-white">+Rs. {parseFloat(selectedSale.tax).toFixed(2)}</span></p>
                )}
                {parseFloat(selectedSale.discount) > 0 && (
                  <p className="text-slate-400">Discount: <span className="text-white">-Rs. {parseFloat(selectedSale.discount).toFixed(2)}</span></p>
                )}
                <p className="text-base font-bold text-white pt-1">Total: <span className="text-emerald-400">Rs. {parseFloat(selectedSale.totalAmount).toFixed(2)}</span></p>
                <p className="text-slate-400">Paid: <span className="text-emerald-400 font-bold">Rs. {parseFloat(selectedSale.paidAmount).toFixed(2)}</span></p>
                {parseFloat(selectedSale.dueAmount) > 0 && (
                  <p className="text-purple-400 font-bold">Balance Due: Rs. {parseFloat(selectedSale.dueAmount).toFixed(2)}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
              >
                <span>🖨️</span> Print Invoice
              </button>
              <button
                onClick={() => setSelectedSale(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
