import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  CreditCard,
  Pill,
  Boxes,
  AlertTriangle,
  ArrowUpRight,
  DollarSign,
  Users,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle,
  Crown,
  Shield,
  UserCheck,
} from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { RevenueChart } from '../components/RevenueChart'
import { getDashboardMetrics } from '../services/reportService'
import { fetchSales } from '../services/salesService'
import { fetchMedicines } from '../services/medicineService'
import { useAuth } from '../context/AuthContext'
import { DashboardMetrics, Sale, Medicine } from '../types'

export const DashboardPage: React.FC = () => {
  const { currentUser, isAdmin, isSuperAdmin } = useAuth()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [recentSales, setRecentSales] = useState<Sale[]>([])
  const [lowStockMeds, setLowStockMeds] = useState<Medicine[]>([])
  const [allMeds, setAllMeds] = useState<Medicine[]>([])
  const [stockSearchQuery, setStockSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [m, sales, meds] = await Promise.all([
        getDashboardMetrics(),
        fetchSales(),
        fetchMedicines(),
      ])
      setMetrics(m)
      setAllMeds(meds)
      setRecentSales(sales.slice(0, 6))

      const low = meds.filter((med) => {
        const totalStock = (med.batches || []).reduce((sum, b) => sum + Number(b.quantity || 0), 0)
        return totalStock <= (med.reorderLevel || 20)
      })
      setLowStockMeds(low.slice(0, 5))
    } catch (err) {
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Filter for staff quick stock lookup
  const searchedMeds = stockSearchQuery.trim()
    ? allMeds.filter(
        (m) =>
          m.name.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
          (m.genericName && m.genericName.toLowerCase().includes(stockSearchQuery.toLowerCase())) ||
          (m.barcode && m.barcode.includes(stockSearchQuery))
      ).slice(0, 5)
    : []

  return (
    <AppLayout title={isAdmin ? 'Executive Administration Dashboard' : 'Counter Dispenser & Staff Portal'}>
      <div className="space-y-6">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-950/50 via-slate-900 to-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1">
              {isSuperAdmin ? (
                <span className="text-purple-400 flex items-center gap-1">
                  <Crown className="w-4 h-4" /> Super Admin Center
                </span>
              ) : isAdmin ? (
                <span className="text-blue-400 flex items-center gap-1">
                  <Shield className="w-4 h-4" /> Pharmacy Management
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">
                  <UserCheck className="w-4 h-4" /> Counter Staff Terminal
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Welcome, {currentUser?.fullName || 'Pharmacist'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAdmin
                ? 'Full financial oversight, inventory valuation, and pharmacy administration'
                : 'Rapid POS billing, stock lookup, and counter register operations'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboardData}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition-all flex items-center gap-2 text-xs font-semibold"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              to="/pos"
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Open POS Terminal</span>
            </Link>
          </div>
        </div>

        {/* ----------------- ADMIN & SUPER ADMIN VIEW ----------------- */}
        {isAdmin ? (
          <>
            {/* 4 Executive Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Today's Sales</span>
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-white">
                    Rs. {(metrics?.todaySales || 0).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5" /> Live
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Live POS transactions today</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Sales Turnover</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-white">
                    Rs. {(metrics?.totalSales || 0).toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">All-time revenue generated</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Estimated Net Profit</span>
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-purple-300">
                    Rs. {(metrics?.totalProfit || 0).toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">After operational expenses</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Low Stock Warnings</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-amber-400">
                    {metrics?.lowStockCount || 0}
                  </span>
                  <Link to="/inventory" className="text-xs font-bold text-blue-400 hover:underline">
                    View Items →
                  </Link>
                </div>
                <p className="text-[11px] text-slate-500">Below minimum reorder level</p>
              </div>
            </div>

            {/* Revenue Chart Section & Quick Administration Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base">Weekly Revenue Velocity</h3>
                    <p className="text-xs text-slate-400">Daily turnover vs profit trajectory</p>
                  </div>
                </div>
                <RevenueChart />
              </div>

              <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white text-base mb-3">Management Quick Stats</h3>
                  <div className="space-y-3 divide-y divide-slate-800/80 text-xs">
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-slate-400">Customer Dues (Receivable)</span>
                      <span className="font-bold text-purple-400 font-mono">
                        Rs. {(metrics?.customerDues || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="pt-3 flex items-center justify-between">
                      <span className="text-slate-400">Supplier Dues (Payable)</span>
                      <span className="font-bold text-red-400 font-mono">
                        Rs. {(metrics?.supplierDues || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="pt-3 flex items-center justify-between">
                      <span className="text-slate-400">Total Medicines in Catalog</span>
                      <span className="font-bold text-white font-mono">{metrics?.totalMedicines || 0}</span>
                    </div>
                    <div className="pt-3 flex items-center justify-between">
                      <span className="text-slate-400">Expiring in 90 Days</span>
                      <span className="font-bold text-amber-400 font-mono">{metrics?.expiredCount || 0} batches</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 space-y-2">
                  <Link
                    to="/users"
                    className="w-full py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"
                  >
                    <Users className="w-4 h-4" />
                    <span>Manage Staff & Roles</span>
                  </Link>
                  <Link
                    to="/reports"
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-bold rounded-2xl border border-slate-700 flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Full P&L Financial Report →</span>
                  </Link>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* ----------------- STAFF / COUNTER DISPENSER VIEW ----------------- */
          <>
            {/* Quick Staff Actions & Live Stock Lookup */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 cols: Fast Medicine Stock Search */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Search className="w-4 h-4 text-blue-400" />
                    Quick Medicine Stock & Price Lookup
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Type any drug name or barcode to check available stock and batch prices instantly
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search medicine by name, generic formula, or barcode..."
                    value={stockSearchQuery}
                    onChange={(e) => setStockSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {stockSearchQuery.trim() && (
                  <div className="divide-y divide-slate-800 bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                    {searchedMeds.length === 0 ? (
                      <p className="text-xs text-slate-500 py-3 text-center">No matching medicines in stock.</p>
                    ) : (
                      searchedMeds.map((med) => {
                        const batches = med.batches || []
                        const totalStock = batches.reduce((s, b) => s + Number(b.quantity || 0), 0)
                        const primary = batches[0]

                        return (
                          <div key={med.id} className="pt-2 pb-1 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-bold text-white">{med.name}</p>
                              <p className="text-[11px] text-slate-400">
                                {med.genericName || med.category} • {med.unitType}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-emerald-400">
                                Rs. {primary ? Number(primary.salePrice).toFixed(2) : '0.00'}
                              </p>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  totalStock <= 0
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-emerald-500/10 text-emerald-400'
                                }`}
                              >
                                {totalStock} in stock
                              </span>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>Total Medicines in Stock: <strong className="text-white">{metrics?.totalMedicines || 0}</strong></span>
                  <Link to="/medicines" className="text-blue-400 hover:underline font-semibold">
                    View Complete Catalog →
                  </Link>
                </div>
              </div>

              {/* Right 5 cols: Staff POS Launch & Quick Status */}
              <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-white">Counter POS Billing Active</p>
                      <p className="text-[11px] text-emerald-400">Ready to serve customers & print receipts</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Today's Counter Sales:</span>
                      <span className="font-bold text-white">Rs. {(metrics?.todaySales || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Low Stock Items:</span>
                      <span className="font-bold text-amber-400">{metrics?.lowStockCount || 0} items</span>
                    </div>
                  </div>
                </div>

                <Link
                  to="/pos"
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 transition-all text-center block"
                >
                  🚀 Launch Rapid POS Terminal
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Bottom Lists: Recent Transactions & Low Stock Alert table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Invoices */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Recent Counter Sales</h3>
              <Link to="/sales" className="text-xs text-blue-400 hover:underline font-semibold">
                All Invoices →
              </Link>
            </div>
            <div className="divide-y divide-slate-800/80">
              {recentSales.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No sales recorded yet.</p>
              ) : (
                recentSales.map((s) => (
                  <div key={s.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white font-mono">{s.invoiceNumber}</p>
                      <p className="text-[11px] text-slate-400">
                        {s.items?.length || 1} items • {s.paymentMethod.toUpperCase()} • {s.customerName || 'Walk-in'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-emerald-400">
                        Rs. {Number(s.totalAmount).toFixed(2)}
                      </p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 capitalize">
                        {s.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low Stock Items */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Critical Low Stock Items</h3>
              <Link to="/inventory" className="text-xs text-amber-400 hover:underline font-semibold">
                Manage Stock →
              </Link>
            </div>
            <div className="divide-y divide-slate-800/80">
              {lowStockMeds.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  All inventory levels are healthy!
                </p>
              ) : (
                lowStockMeds.map((m) => {
                  const stock = (m.batches || []).reduce((sum, b) => sum + Number(b.quantity || 0), 0)
                  return (
                    <div key={m.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{m.name}</p>
                        <p className="text-[11px] text-slate-400">{m.category}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                          {stock} in stock
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
