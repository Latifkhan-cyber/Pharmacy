// Common types for the application

export interface DashboardStats {
  todaySales: number
  todayExpenses: number
  grossProfit: number
  netProfit: number
  totalInventoryValue: number
  lowStockCount: number
  expiredMedicinesCount: number
  expiringSoonCount: number
  customerDues: number
  supplierDues: number
}

export interface SalesSummary {
  totalSales: number
  totalCost: number
  grossProfit: number
  salesCount: number
}

export interface PurchaseSummary {
  totalPurchases: number
  purchasesCount: number
  totalDue: number
}

export interface StockAlert {
  medicineId: string
  medicineName: string
  currentStock: number
  reorderLevel: number
  alertType: 'low_stock' | 'expired' | 'expiring_soon'
}

export interface ReportFilter {
  startDate?: Date
  endDate?: Date
  customerId?: string
  supplierId?: string
  distributorId?: string
  medicineId?: string
  category?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
