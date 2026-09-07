import { fetchSales } from './salesService'
import { fetchPurchases } from './purchaseService'
import { fetchExpenses } from './expenseService'
import { fetchMedicines } from './medicineService'
import { fetchCustomers } from './customerService'
import { fetchSuppliers } from './supplierService'
import { DashboardMetrics } from '../types'

export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const [sales, purchases, expenses, medicines, customers, suppliers] = await Promise.all([
    fetchSales(),
    fetchPurchases(),
    fetchExpenses(),
    fetchMedicines(),
    fetchCustomers(),
    fetchSuppliers(),
  ])

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const currentMonthStr = todayStr.substring(0, 7) // YYYY-MM

  const totalSales = sales.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0)
  const totalPurchases = purchases.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)

  const todaySales = sales
    .filter((s) => s.saleDate?.startsWith(todayStr))
    .reduce((sum, s) => sum + Number(s.totalAmount || 0), 0)

  const monthlySales = sales
    .filter((s) => s.saleDate?.startsWith(currentMonthStr))
    .reduce((sum, s) => sum + Number(s.totalAmount || 0), 0)

  // Estimated gross profit = Sales - Estimated Cost of goods (roughly 70% or calculated) - Expenses
  const estimatedProfit = Math.max(0, totalSales * 0.25 - totalExpenses)

  // Low stock & expired calculation
  let lowStockCount = 0
  let expiredCount = 0
  const ninetyDaysFromNow = new Date(Date.now() + 90 * 86400000)

  medicines.forEach((med) => {
    const batches = med.batches || []
    const totalQty = batches.reduce((sum, b) => sum + Number(b.quantity || 0), 0)
    if (totalQty <= (med.reorderLevel || 20)) {
      lowStockCount++
    }
    batches.forEach((b) => {
      if (b.expiryDate && new Date(b.expiryDate) < ninetyDaysFromNow) {
        expiredCount++
      }
    })
  })

  const customerDues = customers.reduce((sum, c) => sum + Number(c.dueAmount || 0), 0)
  const supplierDues = suppliers.reduce((sum, s) => sum + Number(s.dueAmount || 0), 0)

  return {
    totalSales,
    totalPurchases,
    todaySales,
    monthlySales,
    totalProfit: estimatedProfit,
    lowStockCount,
    expiredCount,
    totalMedicines: medicines.length,
    totalCustomers: customers.length,
    totalSuppliers: suppliers.length,
    customerDues,
    supplierDues,
  }
}
