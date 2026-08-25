import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'

// GET /api/customers/summary - Get customers summary statistics
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    // Total customers
    const totalCustomers = await db.customer.count({
      where: { isActive: true },
    })

    // Customers with dues
    const customersWithDues = await db.customer.count({
      where: {
        isActive: true,
        dueAmount: { gt: 0 },
      },
    })

    // Total sales and dues aggregates
    const aggregates = await db.customer.aggregate({
      where: { isActive: true },
      _sum: {
        totalSales: true,
        totalPaid: true,
        dueAmount: true,
      },
    })

    // Top customers by sales
    const topCustomers = await db.customer.findMany({
      where: {
        isActive: true,
        totalSales: { gt: 0 },
      },
      take: 10,
      orderBy: { totalSales: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        totalSales: true,
        totalPaid: true,
        dueAmount: true,
        _count: {
          select: {
            sales: true,
          },
        },
      },
    })

    // New customers this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const newCustomersThisMonth = await db.customer.count({
      where: {
        createdAt: { gte: startOfMonth },
      },
    })

    // Customers by city
    const customersByCity = await db.customer.groupBy({
      by: ['city'],
      where: {
        isActive: true,
        city: { not: null },
      },
      _count: true,
      orderBy: {
        _count: {
          city: 'desc',
        },
      },
      take: 10,
    })

    // Aging analysis
    const customersWithPendingSales = await db.customer.findMany({
      where: {
        isActive: true,
        dueAmount: { gt: 0 },
      },
      include: {
        sales: {
          where: {
            paymentStatus: { in: ['pending', 'partial'] },
          },
          select: {
            saleDate: true,
            dueAmount: true,
          },
        },
      },
    })

    const aging = {
      current: 0, // 0-30 days
      days30: 0, // 31-60 days
      days60: 0, // 61-90 days
      days90Plus: 0, // 90+ days
    }

    const today = new Date()

    customersWithPendingSales.forEach((customer) => {
      customer.sales.forEach((sale) => {
        const dueAmount = parseFloat(sale.dueAmount.toString())
        const daysDue = Math.floor((today.getTime() - new Date(sale.saleDate).getTime()) / (1000 * 60 * 60 * 24))

        if (daysDue <= 30) {
          aging.current += dueAmount
        } else if (daysDue <= 60) {
          aging.days30 += dueAmount
        } else if (daysDue <= 90) {
          aging.days60 += dueAmount
        } else {
          aging.days90Plus += dueAmount
        }
      })
    })

    return NextResponse.json({
      success: true,
      data: {
        totalCustomers,
        activeCustomers: totalCustomers,
        customersWithDues,
        newCustomersThisMonth,
        totalSales: aggregates._sum.totalSales ? parseFloat(aggregates._sum.totalSales.toString()) : 0,
        totalPaid: aggregates._sum.totalPaid ? parseFloat(aggregates._sum.totalPaid.toString()) : 0,
        totalDues: aggregates._sum.dueAmount ? parseFloat(aggregates._sum.dueAmount.toString()) : 0,
        averageSalesPerCustomer: totalCustomers > 0 
          ? (aggregates._sum.totalSales ? parseFloat(aggregates._sum.totalSales.toString()) : 0) / totalCustomers 
          : 0,
        topCustomers: topCustomers.map((customer) => ({
          ...customer,
          totalSales: parseFloat(customer.totalSales.toString()),
          totalPaid: parseFloat(customer.totalPaid.toString()),
          dueAmount: parseFloat(customer.dueAmount.toString()),
        })),
        customersByCity: customersByCity.map((item) => ({
          city: item.city || 'Unknown',
          count: item._count,
        })),
        aging,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
