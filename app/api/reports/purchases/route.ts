import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'

// GET /api/reports/purchases - Get detailed purchases report
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

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
      where.purchaseDate = dateFilter
    }

    // Overall summary
    const summary = await db.purchase.aggregate({
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

    // Purchases by supplier
    const bySupplier = await db.purchase.groupBy({
      by: ['supplierId'],
      where,
      _sum: {
        totalAmount: true,
        dueAmount: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          totalAmount: 'desc',
        },
      },
      take: 10,
    })

    const supplierIds = bySupplier.map((item) => item.supplierId)
    const suppliers = await db.supplier.findMany({
      where: { id: { in: supplierIds } },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    })

    const topSuppliers = bySupplier.map((item) => {
      const supplier = suppliers.find((s) => s.id === item.supplierId)
      return {
        supplier,
        totalPurchases: item._sum.totalAmount ? parseFloat(item._sum.totalAmount.toString()) : 0,
        dueAmount: item._sum.dueAmount ? parseFloat(item._sum.dueAmount.toString()) : 0,
        purchaseCount: item._count,
      }
    })

    // Most purchased medicines
    const mostPurchased = await db.purchaseItem.groupBy({
      by: ['medicineId'],
      where: {
        purchase: where,
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

    const medicineIds = mostPurchased.map((item) => item.medicineId)
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

    const topPurchasedMedicines = mostPurchased.map((item) => {
      const medicine = medicines.find((m) => m.id === item.medicineId)
      return {
        medicine,
        quantityPurchased: item._sum.quantity || 0,
        totalCost: item._sum.total ? parseFloat(item._sum.total.toString()) : 0,
      }
    })

    // Purchases by payment status
    const byPaymentStatus = await db.purchase.groupBy({
      by: ['paymentStatus'],
      where,
      _sum: {
        totalAmount: true,
        dueAmount: true,
      },
      _count: true,
    })

    // Time-based trend
    const purchases = await db.purchase.findMany({
      where,
      select: {
        purchaseDate: true,
        totalAmount: true,
      },
      orderBy: { purchaseDate: 'asc' },
    })

    const timeTrend: Record<string, { amount: number; count: number }> = {}
    
    purchases.forEach((purchase) => {
      const key = new Date(purchase.purchaseDate).toISOString().split('T')[0]
      if (!timeTrend[key]) {
        timeTrend[key] = { amount: 0, count: 0 }
      }
      timeTrend[key].amount += parseFloat(purchase.totalAmount.toString())
      timeTrend[key].count++
    })

    const trend = Object.entries(timeTrend).map(([date, data]) => ({
      date,
      ...data,
    })).sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalPurchases: summary._sum.totalAmount ? parseFloat(summary._sum.totalAmount.toString()) : 0,
          totalDiscount: summary._sum.discount ? parseFloat(summary._sum.discount.toString()) : 0,
          totalTax: summary._sum.tax ? parseFloat(summary._sum.tax.toString()) : 0,
          totalPaid: summary._sum.paidAmount ? parseFloat(summary._sum.paidAmount.toString()) : 0,
          totalDue: summary._sum.dueAmount ? parseFloat(summary._sum.dueAmount.toString()) : 0,
          purchaseCount: summary._count,
          averagePurchase: summary._count > 0 
            ? (summary._sum.totalAmount ? parseFloat(summary._sum.totalAmount.toString()) : 0) / summary._count
            : 0,
        },
        topSuppliers,
        topPurchasedMedicines,
        byPaymentStatus: byPaymentStatus.map((item) => ({
          status: item.paymentStatus,
          amount: item._sum.totalAmount ? parseFloat(item._sum.totalAmount.toString()) : 0,
          dueAmount: item._sum.dueAmount ? parseFloat(item._sum.dueAmount.toString()) : 0,
          count: item._count,
        })),
        trend,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
