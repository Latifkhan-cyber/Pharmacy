import React from 'react'
import { Link } from 'react-router-dom'
import {
  Pill,
  CreditCard,
  ShieldCheck,
  TrendingUp,
  Boxes,
  Clock,
  Sparkles,
  CheckCircle2,
  Users,
  Building2,
  Receipt,
  Lock,
  ArrowRight,
  ShieldAlert,
  Printer,
  Barcode,
} from 'lucide-react'

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/30">
              💊
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-white flex items-center gap-2">
                PrimeCare <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold">OS 2.0</span>
              </span>
              <span className="text-xs text-slate-400 font-medium block">Enterprise Pharmacy Intelligence</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
            <a href="#solutions" className="hover:text-blue-400 transition-colors">Counter POS</a>
            <a href="#roles" className="hover:text-blue-400 transition-colors">Role Security</a>
            <a href="#gallery" className="hover:text-blue-400 transition-colors">Showcase</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login?portal=staff"
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              Staff POS Login
            </Link>
            <Link
              to="/login?portal=admin"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/30 transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> Next-Gen Cloud Pharmacy Operating System
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
                Smart Pharmacy Management & <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">Rapid POS Billing</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                Engineered for modern pharmacies, retail chemists, and clinic dispensaries. Real-time batch tracking, instant barcode scanning, automated expiry alerts, thermal receipt printing, and segregated staff vs admin security.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  to="/login?portal=staff"
                  className="px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-600/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <CreditCard className="w-4 h-4" />
                  Launch Counter Staff POS
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/login?portal=admin"
                  className="px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 shadow-xl flex items-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <ShieldAlert className="w-4 h-4 text-blue-400" />
                  Super Admin Console
                </Link>
              </div>

              {/* Highlights pills */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-800/80">
                <div>
                  <div className="text-2xl font-black text-white">99.9%</div>
                  <div className="text-xs text-slate-400">Inventory Accuracy</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-400">&lt; 2s</div>
                  <div className="text-xs text-slate-400">Rapid POS Checkout</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-blue-400">Zero Dues</div>
                  <div className="text-xs text-slate-400">Automated Ledger</div>
                </div>
              </div>
            </div>

            {/* Right Showcase Image Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl shadow-blue-500/10 group">
                <img
                  src="https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1000&q=80"
                  alt="Modern Pharmacy & Medicine Dispensing"
                  className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                
                {/* Floating Interactive Badge */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live System Active
                    </span>
                    <span className="text-[10px] text-slate-400">Firestore Cloud Sync</span>
                  </div>
                  <div className="text-sm font-semibold text-white">
                    Integrated Expiry & Batch Traceability
                  </div>
                  <div className="text-xs text-slate-400">
                    Staff seamlessly sell & update stock while executive financials stay strictly confidential.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Showcase Gallery */}
      <section id="gallery" className="py-16 bg-slate-900/50 border-y border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400">Visual Showcase</h2>
            <p className="text-3xl font-extrabold text-white">Designed for High-Volume Pharmacy Operations</p>
            <p className="text-sm text-slate-400">Built to handle thousands of SKUs, batch expiry schedules, and continuous checkout counter traffic.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex flex-col group hover:border-slate-700 transition-all">
              <div className="h-48 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80"
                  alt="Medicine Capsules and Formulations"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-blue-600/90 backdrop-blur-sm text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg text-white">
                  Stock Control
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between text-left">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">Batch & Expiry Management</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Instantly register new medicine batches with custom expiry dates, shelf locations, and automatic near-expiry flags.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex flex-col group hover:border-slate-700 transition-all">
              <div className="h-48 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=800&q=80"
                  alt="Pharmacy Shelves and Dispensary"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-sm text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg text-white">
                  POS Counter
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between text-left">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">Rapid Thermal POS Billing</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    One-click barcode lookup, automatic tax calculation, customer balance tracking, and clean 80mm thermal receipt printing.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex flex-col group hover:border-slate-700 transition-all">
              <div className="h-48 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80"
                  alt="Doctor Prescription and Medicine"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-purple-600/90 backdrop-blur-sm text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg text-white">
                  Executive Security
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between text-left">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">Multi-Role Segregation</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Counter staff only see medicine sell & update forms. Profit margins, purchase costs, and financial reports remain private to Super Admins.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400">Everything Included</h2>
          <p className="text-3xl sm:text-4xl font-black text-white">Engineered for Accuracy & Speed</p>
          <p className="text-sm text-slate-400">Everything your pharmacy needs to operate effortlessly without missing a beat.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Barcode className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Barcode & Search</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instant medicine lookup by generic name, brand, barcode, or shelf number during live customer checkouts.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Thermal Printing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Clean 80mm/58mm thermal receipts with clean store header, itemized pricing, tax breakdown, and change dues.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Expiry Intelligence</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Color-coded expiry badges. Automated warnings for batches expiring within 30, 60, or 90 days.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Super Admin Control</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Create and manage staff accounts, assign granular roles, and protect sensitive financial margins.
            </p>
          </div>
        </div>
      </section>

      {/* Role Segregation Breakdown */}
      <section id="roles" className="py-16 bg-slate-900/40 border-t border-slate-800/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Dedicated Portals</h2>
            <p className="text-3xl font-black text-white">Separation of Concerns for Maximum Security</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 text-left">
            {/* Staff Card */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-emerald-500/30 relative overflow-hidden space-y-5">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                  Counter Staff & Salesman
                </span>
                <CreditCard className="w-6 h-6 text-emerald-400" />
              </div>

              <h3 className="text-xl font-black text-white">Rapid Sales & Medicine Management</h3>
              <p className="text-xs text-slate-300">
                Staff have direct access to what they need at the front desk without distracting executive dashboards.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Rapid POS Billing & Instant Thermal Invoicing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Add New Medicines with Initial Batches & Expiry Dates</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Update Medicine Information & Quantities</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>View Sales Registers & Customer Outstanding Balances</span>
                </li>
              </ul>

              <Link
                to="/login?portal=staff"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
              >
                Access Staff POS Portal <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Admin Card */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-blue-500/30 relative overflow-hidden space-y-5">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-bold">
                  Super Admin & Owner
                </span>
                <ShieldAlert className="w-6 h-6 text-blue-400" />
              </div>

              <h3 className="text-xl font-black text-white">Full Executive & Financial Suite</h3>
              <p className="text-xs text-slate-300">
                Complete control over purchases, supplier balances, staff role delegation, and net profit analytics.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Executive Financial Dashboard with Net Profit & Margins</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Purchases, Inward Batches & Supplier Credit Ledgers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Staff & User Management with Granular Role Permissions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Daily Expenses & Comprehensive Financial Reports</span>
                </li>
              </ul>

              <Link
                to="/login?portal=admin"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
              >
                Access Super Admin Console <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800 bg-slate-950 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-base">💊</span>
            <span className="font-bold text-white">PrimeCare Pharmacy OS</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login?portal=staff" className="hover:text-emerald-400 transition-colors">Staff Login</Link>
            <Link to="/login?portal=admin" className="hover:text-blue-400 transition-colors">Admin Login</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
