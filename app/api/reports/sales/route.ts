import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'

// GET /api/reports/sales - Get detailed sales report
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const groupBy = searchParams.get('groupBy') || 'day' // day, week, month, category, customer

    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      dateFilter.lte = end
    }

    const where: any = {}
    if (Object.keys(dateFilter).length > 0) {
      where.saleDate = dateFilter
    }

    // Overall summary
    const summary = await db.sale.aggregate({
      where,
      _sum: {
        totalAmount: true,
        discount: true,
        tax: true,
        paidAmount: true,
        dueAmount: true,
      },
      _count: true,
    })

    // Sales by payment method
    const byPaymentMethod = await db.sale.groupBy({
      by: ['paymentMethod'],
      where,
      _sum: { totalAmount: true },
      _count: true,
    })

    // Sales by payment status
    const byPaymentStatus = await db.sale.groupBy({
      by: ['paymentStatus'],
      where,
      _sum: {
        totalAmount: true,
        dueAmount: true,
      },
      _count: true,
    })

    // Top selling medicines
    const topMedicines = await db.saleItem.groupBy({
      by: ['medicineId'],
      where: {
        sale: where,
      },
      _sum: {
        quantity: true,
        total: true,
      },
      orderBy: {
        _sum: {
          total: 'desc',
        },
      },
      take: 20,
    })

    const medicineIds = topMedicines.map((item) => item.medicineId)
    const medicines = await db.medicine.findMany({
      where: { id: { in: medicineIds } },
      select: {
        id: true,
        name: true,
        genericName: true,
        category: true,
        unitType: true,
      },
    })

    const topMedicinesWithDetails = topMedicines.map((item) => {
      const medicine = medicines.find((m) => m.id === item.medicineId)
      return {
        medicine,
        quantitySold: item._sum.quantity || 0,
        totalSales: item._sum.total ? parseFloat(item._sum.total.toString()) : 0,
      }
    })

    // Top customers
    const topCustomers = await db.sale.groupBy({
      by: ['customerId'],
      where: {
        ...where,
        customerId: { not: null },
      },
      _sum: { totalAmount: true },
      _count: true,
      orderBy: {
        _sum: {
          totalAmount: 'desc',
        },
      },
      take: 10,
    })

    const customerIds = topCustomers.map((item) => item.customerId).filter((id): id is string => id !== null)
    const customers = await db.customer.findMany({
      where: { id: { in: customerIds } },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    })

    const topCustomersWithDetails = topCustomers.map((item) => {
      const customer = item.customerId ? customers.find((c) => c.id === item.customerId) : null
      return {
        customer,
        totalSales: item._sum.totalAmount ? parseFloat(item._sum.totalAmount.toString()) : 0,
        salesCount: item._count,
      }
    })

    // Sales by category
    const salesByCategory = await db.saleItem.findMany({
      where: {
        sale: where,
      },
      include: {
        medicine: {
          select: {
            category: true,
          },
        },
      },
    })

    const categoryStats: Record<string, { quantity: number; amount: number; count: number }> = {}
    
    salesByCategory.forEach((item) => {
      const category = item.medicine.category
      if (!categoryStats[category]) {
        categoryStats[category] = { quantity: 0, amount: 0, count: 0 }
      }
      categoryStats[category].quantity += item.quantity
      categoryStats[category].amount += parseFloat(item.total.toString())
      categoryStats[category].count++
    })

    const byCategory = Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      ...stats,
    })).sort((a, b) => b.amount - a.amount)

    // Time-based trend
    const sales = await db.sale.findMany({
      where,
      select: {
        saleDate: true,
        totalAmount: true,
      },
      orderBy: { saleDate: 'asc' },
    })

    const timeTrend: Record<string, { amount: number; count: number }> = {}
    
    sales.forEach((sale) => {
      let key: string
      const date = new Date(sale.saleDate)
      
      if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      } else if (groupBy === 'week') {
        const weekNum = Math.ceil(date.getDate() / 7)
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-W${weekNum}`
      } else {
        key = date.toISOString().split('T')[0]
      }

      if (!timeTrend[key]) {
        timeTrend[key] = { amount: 0, count: 0 }
      }
      timeTrend[key].amount += parseFloat(sale.totalAmount.toString())
      timeTrend[key].count++
    })

    const trend = Object.entries(timeTrend).map(([period, data]) => ({
      period,
      ...data,
    })).sort((a, b) => a.period.localeCompare(b.period))

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalSales: summary._sum.totalAmount ? parseFloat(summary._sum.totalAmount.toString()) : 0,
          totalDiscount: summary._sum.discount ? parseFloat(summary._sum.discount.toString()) : 0,
          totalTax: summary._sum.tax ? parseFloat(summary._sum.tax.toString()) : 0,
          totalPaid: summary._sum.paidAmount ? parseFloat(summary._sum.paidAmount.toString()) : 0,
          totalDue: summary._sum.dueAmount ? parseFloat(summary._sum.dueAmount.toString()) : 0,
          salesCount: summary._count,
          averageSale: summary._count > 0 
            ? (summary._sum.totalAmount ? parseFloat(summary._sum.totalAmount.toString()) : 0) / summary._count
            : 0,
        },
        byPaymentMethod: byPaymentMethod.map((item) => ({
          method: item.paymentMethod,
          amount: item._sum.totalAmount ? parseFloat(item._sum.totalAmount.toString()) : 0,
          count: item._count,
        })),
        byPaymentStatus: byPaymentStatus.map((item) => ({
          status: item.paymentStatus,
          amount: item._sum.totalAmount ? parseFloat(item._sum.totalAmount.toString()) : 0,
          dueAmount: item._sum.dueAmount ? parseFloat(item._sum.dueAmount.toString()) : 0,
          count: item._count,
        })),
        topMedicines: topMedicinesWithDetails,
        topCustomers: topCustomersWithDetails,
        byCategory,
        trend,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
