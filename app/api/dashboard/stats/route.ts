import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const expiringSoonDate = new Date()
    expiringSoonDate.setDate(expiringSoonDate.getDate() + 90)

    // Execute all queries in parallel for ultra-fast response
    const [
      todaySales,
      todayExpenses,
      todaySaleItems,
      batches,
      lowStockMedicines,
      expiredCount,
      expiringSoonCount,
      customerDues,
      supplierDues,
      recentSalesCount,
    ] = await Promise.all([
      db.sale.aggregate({
        where: { saleDate: { gte: today, lt: tomorrow } },
        _sum: { totalAmount: true },
      }),
      db.expense.aggregate({
        where: { expenseDate: { gte: today, lt: tomorrow } },
        _sum: { amount: true },
      }),
      db.saleItem.findMany({
        where: { sale: { saleDate: { gte: today, lt: tomorrow } } },
        include: {
          medicine: {
            include: {
              batches: {
                take: 1,
                orderBy: { expiryDate: 'asc' },
              },
            },
          },
        },
      }),
      db.medicineBatch.findMany({
        where: { quantity: { gt: 0 }, expiryDate: { gte: today } },
      }),
      db.medicine.findMany({
        where: { isActive: true },
        include: {
          batches: {
            where: { quantity: { gt: 0 }, expiryDate: { gte: today } },
          },
        },
      }),
      db.medicineBatch.count({
        where: { expiryDate: { lt: today }, quantity: { gt: 0 } },
      }),
      db.medicineBatch.count({
        where: { expiryDate: { gte: today, lte: expiringSoonDate }, quantity: { gt: 0 } },
      }),
      db.customer.aggregate({ _sum: { dueAmount: true } }),
      db.supplier.aggregate({ _sum: { dueAmount: true } }),
      db.sale.count({ where: { saleDate: { gte: today, lt: tomorrow } } }),
    ])

    // Calculate costs
    let todayCost = 0
    todaySaleItems.forEach((item) => {
      const batch = item.medicine.batches[0]
      if (batch) {
        todayCost += item.quantity * parseFloat(batch.purchasePrice.toString())
      }
    })

    const grossProfit = (todaySales._sum.totalAmount ? parseFloat(todaySales._sum.totalAmount.toString()) : 0) - todayCost
    const netProfit = grossProfit - (todayExpenses._sum.amount ? parseFloat(todayExpenses._sum.amount.toString()) : 0)

    const totalInventoryValue = batches.reduce((sum, batch) => {
      return sum + batch.quantity * parseFloat(batch.purchasePrice.toString())
    }, 0)

    const lowStockCount = lowStockMedicines.filter((medicine) => {
      const totalStock = medicine.batches.reduce((sum, batch) => sum + batch.quantity, 0)
      return totalStock <= medicine.reorderLevel
    }).length

    const availableMedicinesCount = lowStockMedicines.filter((m) => m.batches.length > 0).length

    return NextResponse.json({
      success: true,
      data: {
        todaySales: todaySales._sum.totalAmount ? parseFloat(todaySales._sum.totalAmount.toString()) : 0,
        todayExpenses: todayExpenses._sum.amount ? parseFloat(todayExpenses._sum.amount.toString()) : 0,
        grossProfit,
        netProfit,
        totalInventoryValue,
        lowStockCount,
        expiredMedicinesCount: expiredCount,
        expiringSoonCount,
        availableMedicinesCount,
        customerDues: customerDues._sum.dueAmount ? parseFloat(customerDues._sum.dueAmount.toString()) : 0,
        supplierDues: supplierDues._sum.dueAmount ? parseFloat(supplierDues._sum.dueAmount.toString()) : 0,
        recentSalesCount,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
