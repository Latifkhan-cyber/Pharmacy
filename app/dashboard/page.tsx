'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'
import RevenueChart from '@/components/RevenueChart'

interface DashboardStats {
  todaySales: number
  todayExpenses: number
  grossProfit: number
  netProfit: number
  totalInventoryValue: number
  lowStockCount: number
  expiredMedicinesCount: number
  expiringSoonCount: number
  availableMedicinesCount: number
  customerDues: number
  supplierDues: number
  recentSalesCount: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/dashboard/stats')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setStats(data.data)
          }
        })
        .catch((err) => console.error('Failed to fetch dashboard stats', err))
        .finally(() => setLoading(false))
    }
  }, [status])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  const quickLinks = [
    { title: 'POS Billing', desc: 'Create new sale invoice', href: '/pos', icon: '⚡', color: 'from-emerald-600 to-teal-600' },
    { title: 'Add Medicine', desc: 'Register medicine & stock', href: '/medicines', icon: '💊', color: 'from-blue-600 to-indigo-600' },
    { title: 'Stock Alerts', desc: 'Low stock & expiry items', href: '/inventory', icon: '📦', color: 'from-amber-600 to-orange-600' },
    { title: 'New Purchase', desc: 'Add supplier shipment', href: '/purchases', icon: '🛒', color: 'from-purple-600 to-pink-600' },
    { title: 'Customer Dues', desc: 'Manage credit & balance', href: '/customers', icon: '👥', color: 'from-cyan-600 to-blue-600' },
    { title: 'Reports & P&L', desc: 'View profit & analytics', href: '/reports', icon: '📈', color: 'from-rose-600 to-red-600' },
  ]

  return (
    <AppLayout title="Executive Dashboard">
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900/40 border border-blue-500/20 p-6 rounded-3xl shadow-xl">
          <div>
            <span className="text-xs uppercase font-semibold text-blue-400 tracking-wider">Pharmacy Control Center</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Welcome, {session?.user?.name || session?.user?.username || 'Administrator'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Real-time synchronization with Supabase PostgreSQL.
            </p>
          </div>
          <Link
            href="/pos"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 text-sm"
          >
            <span>💳</span> Open POS Terminal
          </Link>
        </div>

        {/* Primary Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Sales</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2">
                  Rs. {stats?.todaySales?.toFixed(2) ?? '0.00'}
                </h3>
              </div>
              <span className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xl">
                💰
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
              <span>🧾</span> {stats?.recentSalesCount ?? 0} invoices recorded today
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Expenses</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-2">
                  Rs. {stats?.todayExpenses?.toFixed(2) ?? '0.00'}
                </h3>
              </div>
              <span className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xl">
                💸
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
              <span>⚡</span> Utilities, rent & supplies
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Profit</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-blue-400 mt-2">
                  Rs. {stats?.netProfit?.toFixed(2) ?? '0.00'}
                </h3>
              </div>
              <span className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xl">
                📈
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Gross profit: <span className="text-blue-300 font-semibold">Rs. {stats?.grossProfit?.toFixed(2) ?? '0.00'}</span>
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inventory Value</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-indigo-400 mt-2">
                  Rs. {stats?.totalInventoryValue?.toFixed(2) ?? '0.00'}
                </h3>
              </div>
              <span className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-xl">
                📦
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              {stats?.availableMedicinesCount ?? 0} active products in stock
            </p>
          </div>
        </div>

        {/* Revenue & Profit Analytics Graph */}
        <RevenueChart
          salesTotal={stats?.todaySales || 0}
          expensesTotal={stats?.todayExpenses || 0}
          profitTotal={stats?.netProfit || 0}
        />

        {/* Operational Health Alerts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Link href="/inventory" className="bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 rounded-2xl p-5 transition-all group">
            <div className="flex justify-between items-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Low Stock Alert</p>
              <span className="text-sm group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <p className="text-3xl font-black text-amber-300 mt-2">{stats?.lowStockCount ?? 0}</p>
            <p className="text-xs text-amber-200/70 mt-1">Medicines below threshold</p>
          </Link>

          <Link href="/inventory" className="bg-red-500/10 border border-red-500/20 hover:border-red-500/40 rounded-2xl p-5 transition-all group">
            <div className="flex justify-between items-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-400">Expired Batches</p>
              <span className="text-sm group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <p className="text-3xl font-black text-red-300 mt-2">{stats?.expiredMedicinesCount ?? 0}</p>
            <p className="text-xs text-red-200/70 mt-1">Batches needing disposal</p>
          </Link>

          <Link href="/inventory" className="bg-orange-500/10 border border-orange-500/20 hover:border-orange-500/40 rounded-2xl p-5 transition-all group">
            <div className="flex justify-between items-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-400">Near Expiry (90d)</p>
              <span className="text-sm group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <p className="text-3xl font-black text-orange-300 mt-2">{stats?.expiringSoonCount ?? 0}</p>
            <p className="text-xs text-orange-200/70 mt-1">Batches expiring soon</p>
          </Link>

          <Link href="/customers" className="bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 rounded-2xl p-5 transition-all group">
            <div className="flex justify-between items-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-400">Customer Receivables</p>
              <span className="text-sm group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <p className="text-3xl font-black text-purple-300 mt-2">Rs. {stats?.customerDues?.toFixed(2) ?? '0.00'}</p>
            <p className="text-xs text-purple-200/70 mt-1">Total pending customer balance</p>
          </Link>
        </div>

        {/* Quick Module Navigation Grid */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Quick Operations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl transition-all group flex items-start gap-4"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${q.color} flex items-center justify-center text-xl shadow-lg flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  {q.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                    {q.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{q.desc}</p>
                </div>
                <span className="text-slate-500 group-hover:text-slate-300 text-sm">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
