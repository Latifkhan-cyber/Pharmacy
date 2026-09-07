import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  FileSpreadsheet,
  PieChart,
  RefreshCw,
} from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { fetchSales } from '../services/salesService'
import { fetchPurchases } from '../services/purchaseService'
import { fetchExpenses } from '../services/expenseService'
import { fetchMedicines } from '../services/medicineService'
import { Sale, Purchase, Expense, Medicine } from '../types'
import * as XLSX from 'xlsx'

export const ReportsPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [s, p, e, m] = await Promise.all([
        fetchSales(),
        fetchPurchases(),
        fetchExpenses(),
        fetchMedicines(),
      ])
      setSales(s)
      setPurchases(p)
      setExpenses(e)
      setMedicines(m)
    } catch (err) {
      console.error('Error fetching reports data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const totalSales = sales.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0)
  const totalPurchases = purchases.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const estimatedGrossProfit = Math.max(0, totalSales * 0.28)
  const estimatedNetProfit = Math.max(0, estimatedGrossProfit - totalExpenses)

  // Top selling medicines aggregation
  const itemCounts: Record<string, { name: string; qty: number; revenue: number }> = {}
  sales.forEach((s) => {
    (s.items || []).forEach((item) => {
      const key = item.medicineId || item.medicineName || 'Item'
      if (!itemCounts[key]) {
        itemCounts[key] = {
          name: item.medicineName || 'Medicine',
          qty: 0,
          revenue: 0,
        }
      }
      itemCounts[key].qty += Number(item.quantity || 0)
      itemCounts[key].revenue += Number(item.total || 0)
    })
  })

  const topSellingList = Object.values(itemCounts)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6)

  // Export to Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new()

    // 1. Sales Sheet
    const salesData = sales.map((s) => ({
      'Invoice #': s.invoiceNumber,
      'Date': s.saleDate,
      'Customer': s.customerName || 'Walk-in',
      'Payment Method': s.paymentMethod,
      'Status': s.paymentStatus,
      'Total (Rs.)': s.totalAmount,
      'Paid (Rs.)': s.paidAmount,
      'Due (Rs.)': s.dueAmount,
    }))
    const wsSales = XLSX.utils.json_to_sheet(salesData)
    XLSX.utils.book_append_sheet(wb, wsSales, 'Sales')

    // 2. Expenses Sheet
    const expenseData = expenses.map((e) => ({
      'Date': e.expenseDate,
      'Category': e.category,
      'Description': e.description || '',
      'Amount (Rs.)': e.amount,
    }))
    const wsExpenses = XLSX.utils.json_to_sheet(expenseData)
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses')

    // Download
    XLSX.writeFile(wb, `PrimeCare_Pharmacy_Report_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <AppLayout title="Financial Intelligence & Audit Reports">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Financial Reports & P&L Statement
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Comprehensive profit/loss, revenue velocities, top selling formulations, and audit spreadsheets
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel Statement</span>
            </button>
          </div>
        </div>

        {/* P&L 4 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Gross Sales Turnover</span>
            <p className="text-2xl font-black text-white">Rs. {totalSales.toLocaleString()}</p>
            <p className="text-[10px] text-emerald-400 font-semibold">{sales.length} customer invoices</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Inventory Procurement</span>
            <p className="text-2xl font-black text-cyan-400">Rs. {totalPurchases.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400">{purchases.length} purchase orders</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Operating Expenses</span>
            <p className="text-2xl font-black text-red-400">Rs. {totalExpenses.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400">{expenses.length} expense logs</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Estimated Net Profit</span>
            <p className="text-2xl font-black text-emerald-400">Rs. {estimatedNetProfit.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400">After all store overheads</p>
          </div>
        </div>

        {/* Top Moving Medicines */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base">Top Fast-Moving Medicines</h3>
            <div className="divide-y divide-slate-800/80">
              {topSellingList.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">No sales logged yet to rank medicines.</p>
              ) : (
                topSellingList.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-white">{item.name}</p>
                        <p className="text-[11px] text-slate-400">{item.qty} units dispensed</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-emerald-400">
                        Rs. {item.revenue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Expense Category Breakdown */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base">Expense Categorization Breakdown</h3>
            <div className="divide-y divide-slate-800/80">
              {expenses.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">No expenses recorded.</p>
              ) : (
                expenses.slice(0, 5).map((e) => (
                  <div key={e.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{e.category}</p>
                      <p className="text-[11px] text-slate-400">{e.description || 'Routine store cost'}</p>
                    </div>
                    <span className="text-xs font-black text-red-400">
                      Rs. {Number(e.amount).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
