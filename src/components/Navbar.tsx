import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Menu,
  CreditCard,
  LogOut,
  User as UserIcon,
  Settings,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface NavbarProps {
  onMenuClick: () => void
  title?: string
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick, title }) => {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left section: Hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
          {title || 'Pharmacy Management System'}
        </h1>
      </div>

      {/* Right section: Action Buttons & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Rapid POS button */}
        <Link
          to="/pos"
          className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
        >
          <CreditCard className="w-4 h-4" />
          <span>Rapid POS</span>
        </Link>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 transition-all text-xs font-medium text-white"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              {currentUser?.fullName?.[0] || 'A'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold leading-none">{currentUser?.fullName || 'Administrator'}</p>
              <p className="text-[10px] text-slate-400 capitalize mt-0.5">{currentUser?.role || 'Admin'}</p>
            </div>
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-2xl p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-800 text-xs text-slate-400">
                <p className="font-semibold text-white truncate">{currentUser?.fullName}</p>
                <p className="text-[11px] truncate">{currentUser?.email}</p>
              </div>

              <Link
                to="/settings"
                onClick={() => setShowUserDropdown(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-xl transition-all"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                Store Settings
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition-all border-t border-slate-800/60 mt-1"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
