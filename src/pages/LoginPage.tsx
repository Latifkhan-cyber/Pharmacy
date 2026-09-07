import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Lock, Mail, User as UserIcon, ArrowRight, ShieldCheck, CreditCard, Crown, ArrowLeft } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const initialPortal = searchParams.get('portal') === 'staff' ? 'staff' : 'admin'
  const [portalType, setPortalType] = useState<'staff' | 'admin'>(initialPortal)

  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState(
    initialPortal === 'staff' ? 'staff@primecare.com' : 'superadmin@primecare.com'
  )
  const [password, setPassword] = useState('password123')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, register } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (portalType === 'staff') {
      setEmail('staff@primecare.com')
      setPassword('staff123')
    } else {
      setEmail('superadmin@primecare.com')
      setPassword('admin123')
    }
  }, [portalType])

  const handleQuickFill = (roleType: 'super_admin' | 'admin' | 'staff') => {
    setError('')
    if (roleType === 'super_admin') {
      setPortalType('admin')
      setEmail('superadmin@primecare.com')
      setPassword('superadmin123')
    } else if (roleType === 'admin') {
      setPortalType('admin')
      setEmail('admin@primecare.com')
      setPassword('admin123')
    } else {
      setPortalType('staff')
      setEmail('staff@primecare.com')
      setPassword('staff123')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let loggedUser
      if (isRegister) {
        loggedUser = await register(
          email,
          password,
          fullName || (portalType === 'staff' ? 'Counter Staff' : 'Pharmacy Admin'),
          portalType === 'staff' ? 'staff' : 'admin'
        )
      } else {
        loggedUser = await login(email, password)
      }

      // Role-based destination routing
      if (loggedUser.role === 'staff' || loggedUser.role === 'salesman') {
        navigate('/pos')
      } else {
        navigate('/')
      }
    } catch (err: any) {
      console.error('Auth error:', err)
      setError(err?.message || 'Authentication failed. Check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      {/* Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Back to Home button */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          to="/"
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-xl backdrop-blur-md transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-xl shadow-blue-500/25 text-3xl mb-1">
            💊
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            PrimeCare <span className="text-blue-400">Pharmacy OS</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Select your dedicated terminal portal to proceed
          </p>
        </div>

        {/* Portal Switcher Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setPortalType('staff')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              portalType === 'staff'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Counter Staff
          </button>
          <button
            type="button"
            onClick={() => setPortalType('admin')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              portalType === 'admin'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Super Admin / Admin
          </button>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div>
              <h3 className="text-sm font-black text-white">
                {portalType === 'staff' ? 'Counter Staff Sign In' : 'Management & Admin Sign In'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {portalType === 'staff'
                  ? 'Access POS Billing, Search & Medicine Management'
                  : 'Access Financials, Inventory, Purchases & Roles'}
              </p>
            </div>
            <span
              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                portalType === 'staff'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
              }`}
            >
              {portalType === 'staff' ? 'Staff' : 'Admin'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Pharmacist Name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@pharmacy.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl font-medium">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                portalType === 'staff'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {isRegister
                      ? 'Create Account & Enter'
                      : portalType === 'staff'
                      ? 'Launch Counter POS'
                      : 'Enter Admin Dashboard'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider text-center">
              Quick 1-Click Login Fill
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill('super_admin')}
                className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-semibold text-purple-300 flex flex-col items-center gap-1 transition-all"
              >
                <Crown className="w-3.5 h-3.5 text-purple-400" />
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-semibold text-blue-300 flex flex-col items-center gap-1 transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('staff')}
                className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-semibold text-emerald-300 flex flex-col items-center gap-1 transition-all"
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                Staff POS
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center text-xs text-slate-400 pt-1">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="hover:text-blue-400 font-semibold transition-all text-[11px]"
            >
              {isRegister ? 'Already registered? Sign In' : 'Need a new account? Register here'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default LoginPage
