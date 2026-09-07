import React, { useState, useEffect } from 'react'
import {
  Receipt,
  Search,
  Printer,
  Calendar,
  Eye,
  RefreshCw,
} from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { fetchSales } from '../services/salesService'
import { Sale } from '../types'
import { printThermalReceipt } from '../utils/printReceipt'

export const SalesPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchSales()
      setSales(data)
    } catch (err) {
      console.error('Error fetching sales:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = sales.filter((s) => {
    return (
      !searchQuery.trim() ||
      s.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.customerName && s.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <AppLayout title="Sales Ledger & Invoices">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              Sales & Invoice History
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Complete archive of customer sales, payment breakdowns, and printable receipts
            </p>
          </div>

          <button
            onClick={loadData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition-all self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-lg">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search invoice number or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Invoice #</th>
                  <th className="py-3.5 px-4 font-bold">Date & Time</th>
                  <th className="py-3.5 px-4 font-bold">Customer</th>
                  <th className="py-3.5 px-4 font-bold">Method</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Total Amount</th>
                  <th className="py-3.5 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-slate-500">
                      Loading sales ledger...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-slate-500">
                      No sales records found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-800/40 transition-all">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                        {sale.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(sale.saleDate).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white">
                        {sale.customerName || 'Walk-in Customer'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold uppercase text-[10px]">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            sale.paymentStatus === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {sale.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-400 text-sm">
                        Rs. {Number(sale.totalAmount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedSale(sale)}
                          className="p-1.5 text-blue-400 hover:bg-slate-800 rounded-lg transition-all"
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base">Invoice Details</h3>
                <p className="text-xs text-blue-400 font-mono">{selectedSale.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Customer: <strong className="text-white">{selectedSale.customerName || 'Walk-in'}</strong></span>
                <span>Date: {new Date(selectedSale.saleDate).toLocaleDateString()}</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] text-slate-500 uppercase border-b border-slate-800">
                    <tr>
                      <th className="pb-1">Item</th>
                      <th className="pb-1 text-center">Qty</th>
                      <th className="pb-1 text-right">Price</th>
                      <th className="pb-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {selectedSale.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 text-white truncate max-w-[140px]">
                          {item.medicineName || item.batchNumber || 'Item'}
                        </td>
                        <td className="py-1.5 text-center text-slate-300">{item.quantity}</td>
                        <td className="py-1.5 text-right text-slate-300">Rs. {Number(item.salePrice).toFixed(2)}</td>
                        <td className="py-1.5 text-right text-emerald-400 font-bold">Rs. {Number(item.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-800 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span>Rs. {Number(selectedSale.subtotal).toFixed(2)}</span>
                </div>
                {Number(selectedSale.tax) > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Tax:</span>
                    <span>+Rs. {Number(selectedSale.tax).toFixed(2)}</span>
                  </div>
                )}
                {Number(selectedSale.discount) > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Discount:</span>
                    <span>-Rs. {Number(selectedSale.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-bold text-sm pt-1 border-t border-slate-800">
                  <span>Total Amount:</span>
                  <span className="text-emerald-400">Rs. {Number(selectedSale.totalAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Paid:</span>
                  <span className="text-emerald-400">Rs. {Number(selectedSale.paidAmount).toFixed(2)}</span>
                </div>
                {Number(selectedSale.dueAmount) > 0 && (
                  <div className="flex justify-between text-purple-400 font-bold">
                    <span>Due Balance:</span>
                    <span>Rs. {Number(selectedSale.dueAmount).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => printThermalReceipt(selectedSale)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
