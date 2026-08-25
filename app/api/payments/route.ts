import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'

// GET /api/payments - Get all payments
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const paymentType = searchParams.get('paymentType') // customer, supplier
    const paymentMethod = searchParams.get('paymentMethod') // cash, card, online, bank
    const customerId = searchParams.get('customerId')
    const supplierId = searchParams.get('supplierId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const skip = (page - 1) * pageSize

    const where: any = {}
    
    if (paymentType) {
      where.paymentType = paymentType
    }
    
    if (paymentMethod) {
      where.paymentMethod = paymentMethod
    }

    if (customerId) {
      where.customerId = customerId
    }

    if (supplierId) {
      where.supplierId = supplierId
    }

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

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          supplier: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          sale: {
            select: {
              invoiceNumber: true,
            },
          },
          purchase: {
            select: {
              invoiceNumber: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
        orderBy: { paymentDate: 'desc' },
      }),
      db.payment.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: payments,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
