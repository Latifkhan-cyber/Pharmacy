import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'

// GET /api/payments/summary - Get payments summary
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    if (startDate || endDate) {
      where.paymentDate = {}
      if (startDate) {
        where.paymentDate.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.paymentDate.lte = end
      }
    }

    // Total payments summary
    const [totalPayments, customerPayments, supplierPayments] = await Promise.all([
      db.payment.aggregate({
        where,
        _sum: {
          amount: true,
        },
        _count: true,
      }),
      db.payment.aggregate({
        where: {
          ...where,
          paymentType: 'customer',
        },
        _sum: {
          amount: true,
        },
        _count: true,
      }),
      db.payment.aggregate({
        where: {
          ...where,
          paymentType: 'supplier',
        },
        _sum: {
          amount: true,
        },
        _count: true,
      }),
    ])

    // Payments by method
    const paymentsByMethod = await db.payment.groupBy({
      by: ['paymentMethod'],
      where,
      _sum: {
        amount: true,
      },
      _count: true,
    })

    // Payments by type
    const paymentsByType = await db.payment.groupBy({
      by: ['paymentType'],
      where,
      _sum: {
        amount: true,
      },
      _count: true,
    })

    // Daily payments trend
    const payments = await db.payment.findMany({
      where,
      select: {
        paymentDate: true,
        amount: true,
        paymentType: true,
      },
      orderBy: { paymentDate: 'asc' },
    })

    const dailyTrend: Record<string, { customer: number; supplier: number; total: number }> = {}

    payments.forEach((payment) => {
      const dateKey = payment.paymentDate.toISOString().split('T')[0]
      if (!dailyTrend[dateKey]) {
        dailyTrend[dateKey] = { customer: 0, supplier: 0, total: 0 }
      }

      const amount = parseFloat(payment.amount.toString())
      dailyTrend[dateKey].total += amount

      if (payment.paymentType === 'customer') {
        dailyTrend[dateKey].customer += amount
      } else {
        dailyTrend[dateKey].supplier += amount
      }
    })

    const trend = Object.entries(dailyTrend).map(([date, data]) => ({
      date,
      ...data,
    })).sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      success: true,
      data: {
        totalPayments: {
          amount: totalPayments._sum.amount ? parseFloat(totalPayments._sum.amount.toString()) : 0,
          count: totalPayments._count,
        },
        customerPayments: {
          amount: customerPayments._sum.amount ? parseFloat(customerPayments._sum.amount.toString()) : 0,
          count: customerPayments._count,
        },
        supplierPayments: {
          amount: supplierPayments._sum.amount ? parseFloat(supplierPayments._sum.amount.toString()) : 0,
          count: supplierPayments._count,
        },
        paymentsByMethod: paymentsByMethod.map((item) => ({
          method: item.paymentMethod,
          amount: item._sum.amount ? parseFloat(item._sum.amount.toString()) : 0,
          count: item._count,
        })),
        paymentsByType: paymentsByType.map((item) => ({
          type: item.paymentType,
          amount: item._sum.amount ? parseFloat(item._sum.amount.toString()) : 0,
          count: item._count,
        })),
        trend,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
