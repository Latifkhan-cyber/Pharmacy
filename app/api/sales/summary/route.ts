import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'

// GET /api/sales/summary - Get sales summary with date range
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const customerId = searchParams.get('customerId')

    const where: any = {}

    if (startDate || endDate) {
      where.saleDate = {}
      if (startDate) {
        where.saleDate.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.saleDate.lte = end
      }
    }

    if (customerId) {
      where.customerId = customerId
    }

    // Get sales aggregates
    const [salesAgg, salesCount, totalDues] = await Promise.all([
      db.sale.aggregate({
        where,
        _sum: {
          totalAmount: true,
          paidAmount: true,
          discount: true,
          tax: true,
        },
      }),
      db.sale.count({ where }),
      db.sale.aggregate({
        where: {
          ...where,
          paymentStatus: { in: ['pending', 'partial'] },
        },
        _sum: {
          dueAmount: true,
        },
      }),
    ])

    // Get sales by payment method
    const salesByPaymentMethod = await db.sale.groupBy({
      by: ['paymentMethod'],
      where,
      _sum: {
        totalAmount: true,
      },
      _count: true,
    })

    // Get top selling medicines
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
          quantity: 'desc',
        },
      },
      take: 10,
    })

    // Fetch medicine details for top medicines
    const medicineIds = topMedicines.map((item) => item.medicineId)
    const medicines = await db.medicine.findMany({
      where: {
        id: { in: medicineIds },
      },
      select: {
        id: true,
        name: true,
        genericName: true,
        category: true,
      },
    })

    const topMedicinesWithDetails = topMedicines.map((item) => {
      const medicine = medicines.find((m) => m.id === item.medicineId)
      return {
        medicine,
        quantitySold: item._sum.quantity || 0,
        totalSales: item._sum.total || 0,
      }
    })

    // Calculate cost and profit (approximate)
    const saleItems = await db.saleItem.findMany({
      where: {
        sale: where,
      },
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
    })

    let totalCost = 0
    saleItems.forEach((item) => {
      const batch = item.medicine.batches[0]
      if (batch) {
        totalCost += item.quantity * parseFloat(batch.purchasePrice.toString())
      }
    })

    const totalSales = salesAgg._sum.totalAmount ? parseFloat(salesAgg._sum.totalAmount.toString()) : 0
    const grossProfit = totalSales - totalCost

    return NextResponse.json({
      success: true,
      data: {
        totalSales,
        totalCost,
        grossProfit,
        salesCount,
        totalDiscount: salesAgg._sum.discount ? parseFloat(salesAgg._sum.discount.toString()) : 0,
        totalTax: salesAgg._sum.tax ? parseFloat(salesAgg._sum.tax.toString()) : 0,
        totalPaid: salesAgg._sum.paidAmount ? parseFloat(salesAgg._sum.paidAmount.toString()) : 0,
        totalDues: totalDues._sum.dueAmount ? parseFloat(totalDues._sum.dueAmount.toString()) : 0,
        averageSale: salesCount > 0 ? totalSales / salesCount : 0,
        profitMargin: totalSales > 0 ? (grossProfit / totalSales) * 100 : 0,
        salesByPaymentMethod: salesByPaymentMethod.map((item) => ({
          paymentMethod: item.paymentMethod,
          totalAmount: item._sum.totalAmount ? parseFloat(item._sum.totalAmount.toString()) : 0,
          count: item._count,
        })),
        topSellingMedicines: topMedicinesWithDetails,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
