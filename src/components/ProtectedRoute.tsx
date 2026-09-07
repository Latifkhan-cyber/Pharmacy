import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
  superAdminOnly?: boolean
  allowedRoles?: Array<'super_admin' | 'admin' | 'staff' | 'salesman'>
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  adminOnly = false,
  superAdminOnly = false,
  allowedRoles,
}) => {
  const { currentUser, loading, isAdmin, isSuperAdmin } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold tracking-wider uppercase text-blue-400">
          Loading Pharmacy OS...
        </p>
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  // Super Admin check
  if (superAdminOnly && !isSuperAdmin) {
    return <Navigate to="/" replace />
  }

  // Admin check (allows Super Admin and Admin)
  if (adminOnly && !isAdmin) {
    // If staff/salesman tries to access admin route, send them to POS counter
    return <Navigate to="/pos" replace />
  }

  // Allowed Roles check if explicitly supplied
  if (allowedRoles && currentUser.role && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/pos" replace />
  }

  return <>{children}</>
}
