import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💊</span>
            <div>
              <span className="font-extrabold text-lg text-white tracking-wide">PrimeCare</span>
              <span className="block text-[10px] uppercase font-semibold text-blue-400 tracking-wider">Pharmacy OS</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-8 flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-300 text-xs font-semibold mx-auto">
          <span>⚡</span> Complete Pharmacy & Wholesale ERP Solution
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          Modern Pharmacy Management <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
            & Wholesale Distribution
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
          All-in-one system for batch inventory, POS billing, supplier purchases, customer credit ledgers (Udhaar), field distributor tracking, and exact profit calculations.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl shadow-xl shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 text-sm"
          >
            Go to Dashboard →
          </Link>

          <Link
            href="/pos"
            className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold rounded-2xl transition-all text-sm flex items-center gap-2"
          >
            <span>💳</span> POS Billing Terminal
          </Link>
        </div>

        {/* Feature Grid Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-12 text-left">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <span className="text-2xl">📦</span>
            <h3 className="font-bold text-white text-sm mt-3">Batch & Expiry Control</h3>
            <p className="text-xs text-slate-400 mt-1">Batch pricing, near-expiry alerts (90d), and reorder thresholds.</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <span className="text-2xl">⚡</span>
            <h3 className="font-bold text-white text-sm mt-3">Fast POS Billing</h3>
            <p className="text-xs text-slate-400 mt-1">Quick barcode/item search, discount engine, and receipt printing.</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <span className="text-2xl">👥</span>
            <h3 className="font-bold text-white text-sm mt-3">Credit (Udhaar) Ledger</h3>
            <p className="text-xs text-slate-400 mt-1">Customer & supplier dues tracking, credit limits, and payments.</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <span className="text-2xl">📈</span>
            <h3 className="font-bold text-white text-sm mt-3">Exact Net Profit</h3>
            <p className="text-xs text-slate-400 mt-1">Automated computation: Revenue − COGS − Expenses = Net Profit.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
        PrimeCare Pharmacy Management System • Powered by Supabase & Next.js
      </footer>
    </main>
  )
}
