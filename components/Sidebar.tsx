'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'POS Billing', href: '/pos', icon: '💳', highlight: true },
    { label: 'Medicines', href: '/medicines', icon: '💊' },
    { label: 'Inventory & Alerts', href: '/inventory', icon: '📦' },
    { label: 'Sales History', href: '/sales', icon: '🧾' },
    { label: 'Purchases', href: '/purchases', icon: '🛒' },
    { label: 'Suppliers', href: '/suppliers', icon: '🏢' },
    { label: 'Customers & Dues', href: '/customers', icon: '👥' },
    { label: 'Distributors', href: '/distributors', icon: '🚚' },
    { label: 'Expenses', href: '/expenses', icon: '💸' },
    { label: 'Payments Ledger', href: '/payments', icon: '💰' },
    { label: 'Reports & Profit', href: '/reports', icon: '📈' },
    { label: 'Settings', href: '/settings', icon: '⚙️' },
  ]

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/50">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="text-2xl">💊</span>
            <div>
              <span className="font-bold text-base text-white tracking-wide">PrimeCare</span>
              <span className="block text-[10px] uppercase font-semibold text-blue-400 tracking-wider">Pharmacy OS</span>
            </div>
          </Link>

          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : item.highlight
                    ? 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.highlight && !isActive && (
                  <span className="text-[10px] uppercase font-bold bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full">
                    POS
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-500 text-center">
          v1.0.0 • Supabase Connected
        </div>
      </aside>
    </>
  )
}
