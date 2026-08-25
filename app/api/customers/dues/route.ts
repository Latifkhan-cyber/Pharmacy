import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'

// GET /api/customers/dues - Get all customers with outstanding dues
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const sortBy = searchParams.get('sortBy') || 'dueAmount' // dueAmount, name, totalSales
    const sortOrder = searchParams.get('sortOrder') || 'desc' // asc, desc
    
    const skip = (page - 1) * pageSize

    const where = {
      dueAmount: { gt: 0 },
      isActive: true,
    }

    const [customers, total, totalDuesSum] = await Promise.all([
      db.customer.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          sales: {
            where: {
              paymentStatus: { in: ['pending', 'partial'] },
            },
            select: {
              id: true,
              invoiceNumber: true,
              saleDate: true,
              totalAmount: true,
              paidAmount: true,
              dueAmount: true,
              paymentStatus: true,
            },
            orderBy: { saleDate: 'desc' },
          },
          _count: {
            select: {
              sales: true,
              payments: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
      }),
      db.customer.count({ where }),
      db.customer.aggregate({
        where,
        _sum: {
          dueAmount: true,
        },
      }),
    ])

    // Calculate aging for each customer
    const customersWithAging = customers.map((customer) => {
      const aging = {
        current: 0, // 0-30 days
        days30: 0, // 31-60 days
        days60: 0, // 61-90 days
        days90Plus: 0, // 90+ days
      }

      const today = new Date()

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

      return {
        ...customer,
        aging,
        overdueAmount: aging.days30 + aging.days60 + aging.days90Plus,
      }
    })

    return NextResponse.json({
      success: true,
      data: customersWithAging,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      summary: {
        totalDues: totalDuesSum._sum.dueAmount ? parseFloat(totalDuesSum._sum.dueAmount.toString()) : 0,
        customerCount: total,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
