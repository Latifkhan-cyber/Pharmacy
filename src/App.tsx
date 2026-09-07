import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { PosPage } from './pages/PosPage'
import { MedicinesPage } from './pages/MedicinesPage'
import { InventoryPage } from './pages/InventoryPage'
import { SalesPage } from './pages/SalesPage'
import { PurchasesPage } from './pages/PurchasesPage'
import { CustomersPage } from './pages/CustomersPage'
import { SuppliersPage } from './pages/SuppliersPage'
import { DistributorsPage } from './pages/DistributorsPage'
import { ExpensesPage } from './pages/ExpensesPage'
import { PaymentsPage } from './pages/PaymentsPage'
import { ReportsPage } from './pages/ReportsPage'
import { UsersPage } from './pages/UsersPage'
import { SettingsPage } from './pages/SettingsPage'

// Smart Root Route: Shows Landing Page for guests, POS for Staff, Admin Dashboard for Admins
const RootRoute: React.FC = () => {
  const { currentUser, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold tracking-wider uppercase text-blue-400">
          Loading PrimeCare Pharmacy OS...
        </p>
      </div>
    )
  }

  // Unauthenticated user -> Landing Page
  if (!currentUser) {
    return <LandingPage />
  }

  // Counter Staff / Salesman -> Direct POS billing workstation
  if (!isAdmin) {
    return <Navigate to="/pos" replace />
  }

  // Admin / Super Admin -> Executive Dashboard
  return (
    <ProtectedRoute adminOnly>
      <DashboardPage />
    </ProtectedRoute>
  )
}

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Root Route */}
          <Route path="/" element={<RootRoute />} />

          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Staff & Admin Common Routes */}
          <Route
            path="/pos"
            element={
              <ProtectedRoute>
                <PosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medicines"
            element={
              <ProtectedRoute>
                <MedicinesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales"
            element={
              <ProtectedRoute>
                <SalesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <CustomersPage />
              </ProtectedRoute>
            }
          />

          {/* Strict Admin & Super Admin Only Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute adminOnly>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute adminOnly>
                <InventoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchases"
            element={
              <ProtectedRoute adminOnly>
                <PurchasesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/suppliers"
            element={
              <ProtectedRoute adminOnly>
                <SuppliersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/distributors"
            element={
              <ProtectedRoute adminOnly>
                <DistributorsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute adminOnly>
                <ExpensesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute adminOnly>
                <PaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute adminOnly>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute adminOnly>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute adminOnly>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
export default App
