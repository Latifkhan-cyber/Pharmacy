import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'
import { z } from 'zod'

const distributorSaleSchema = z.object({
  saleDate: z.string().transform((str) => new Date(str)).optional(),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  cost: z.number().min(0, 'Cost must be 0 or greater'),
  notes: z.string().optional(),
})

// GET /api/distributors/:id/sales - Get distributor sales
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const skip = (page - 1) * pageSize

    const where: any = {
      distributorId: params.id,
    }

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

    const [sales, total] = await Promise.all([
      db.distributorSale.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { saleDate: 'desc' },
      }),
      db.distributorSale.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: sales,
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

// POST /api/distributors/:id/sales - Add sale for distributor
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const validatedData = distributorSaleSchema.parse(body)

    // Check if distributor exists
    const distributor = await db.distributor.findUnique({
      where: { id: params.id },
    })

    if (!distributor) {
      return NextResponse.json(
        { success: false, error: 'Distributor not found' },
        { status: 404 }
      )
    }

    // Calculate profit
    const profit = validatedData.amount - validatedData.cost

    // Create sale and update distributor in transaction
    const sale = await db.$transaction(async (tx) => {
      const newSale = await tx.distributorSale.create({
        data: {
          distributorId: params.id,
          saleDate: validatedData.saleDate || new Date(),
          amount: validatedData.amount,
          cost: validatedData.cost,
          profit,
          notes: validatedData.notes,
        },
      })

      // Update distributor totals
      await tx.distributor.update({
        where: { id: params.id },
        data: {
          totalSales: { increment: validatedData.amount },
          totalProfit: { increment: profit },
        },
      })

      return newSale
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        module: 'DISTRIBUTOR',
        description: `Added sale for distributor: ${distributor.name}`,
      },
    })

    return NextResponse.json({
      success: true,
      data: sale,
      message: 'Sale added successfully',
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }
    return handleError(error)
  }
}
