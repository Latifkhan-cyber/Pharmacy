'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

interface NavbarProps {
  onToggleSidebar: () => void
  title?: string
}

export default function Navbar({ onToggleSidebar, title }: NavbarProps) {
  const { data: session } = useSession()

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
          aria-label="Toggle Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {title && <h2 className="text-lg font-bold text-white tracking-wide">{title}</h2>}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/pos"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all"
        >
          <span>⚡</span> POS Terminal
        </Link>

        {session?.user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-white leading-tight">
                {session.user.name || session.user.username}
              </p>
              <p className="text-[10px] text-blue-400 font-medium uppercase tracking-wider">
                {session.user.role || 'Admin'}
              </p>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              title="Sign Out"
              className="p-2 text-xs font-medium text-red-300 hover:text-red-100 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-all"
            >
              🚪
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
