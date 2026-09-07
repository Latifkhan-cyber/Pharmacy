import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CreditCard,
  Pill,
  Boxes,
  Receipt,
  ShoppingCart,
  Building2,
  Users,
  Truck,
  DollarSign,
  Wallet,
  TrendingUp,
  Settings,
  ShieldAlert,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  highlight?: boolean
  superOnly?: boolean
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { isAdmin, isSuperAdmin, currentUser } = useAuth()

  // Base navigation dedicated for Counter Staff
  const staffNavItems: NavItem[] = [
    { label: 'POS Billing', path: '/pos', icon: CreditCard, highlight: true },
    { label: 'Medicines Catalogue', path: '/medicines', icon: Pill },
    { label: 'Sales History', path: '/sales', icon: Receipt },
    { label: 'Customer Dues', path: '/customers', icon: Users },
  ]

  // Executive navigation for Admin & Super Admin
  const adminNavItems: NavItem[] = [
    { label: 'Admin Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'POS Billing', path: '/pos', icon: CreditCard, highlight: true },
    { label: 'Medicines', path: '/medicines', icon: Pill },
    { label: 'Inventory & Alerts', path: '/inventory', icon: Boxes },
    { label: 'Sales History', path: '/sales', icon: Receipt },
    { label: 'Customers & Dues', path: '/customers', icon: Users },
    { label: 'Purchases', path: '/purchases', icon: ShoppingCart },
    { label: 'Suppliers', path: '/suppliers', icon: Building2 },
    { label: 'Distributors', path: '/distributors', icon: Truck },
    { label: 'Expenses', path: '/expenses', icon: DollarSign },
    { label: 'Payments Ledger', path: '/payments', icon: Wallet },
    { label: 'Reports & Profit', path: '/reports', icon: TrendingUp },
    { label: 'Staff & Roles', path: '/users', icon: ShieldAlert, superOnly: true },
    { label: 'Settings', path: '/settings', icon: Settings },
  ]

  const navItems = isAdmin ? adminNavItems : staffNavItems

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950/40">
          <NavLink to={isAdmin ? '/' : '/pos'} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-xl shadow-lg shadow-blue-500/25 text-white font-black">
              💊
            </div>
            <div>
              <span className="font-extrabold text-base text-white tracking-tight">
                PrimeCare
              </span>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Pharmacy Admin' : 'Counter Staff POS'}
              </span>
            </div>
          </NavLink>

          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : item.highlight
                      ? 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive
                            ? 'text-white'
                            : item.highlight
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.highlight && !isActive && (
                      <span className="text-[9px] uppercase font-black bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded-md">
                        POS
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* User Role Badge in Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="truncate max-w-[120px] font-medium text-white">{currentUser?.fullName || 'Staff'}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-blue-300 uppercase">
            {currentUser?.role?.replace('_', ' ') || 'Staff'}
          </span>
        </div>
      </aside>
    </>
  )
}
export default Sidebar
