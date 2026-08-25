import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'
import { z } from 'zod'

const distributorExpenseSchema = z.object({
  expenseDate: z.string().transform((str) => new Date(str)).optional(),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().optional(),
})

// GET /api/distributors/:id/expenses - Get distributor expenses
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
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const skip = (page - 1) * pageSize

    const where: any = {
      distributorId: params.id,
    }

    if (category) {
      where.category = category
    }

    if (startDate || endDate) {
      where.expenseDate = {}
      if (startDate) {
        where.expenseDate.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.expenseDate.lte = end
      }
    }

    const [expenses, total] = await Promise.all([
      db.distributorExpense.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { expenseDate: 'desc' },
      }),
      db.distributorExpense.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: expenses,
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

// POST /api/distributors/:id/expenses - Add expense for distributor
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const validatedData = distributorExpenseSchema.parse(body)

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

    // Create expense and update distributor in transaction
    const expense = await db.$transaction(async (tx) => {
      const newExpense = await tx.distributorExpense.create({
        data: {
          distributorId: params.id,
          expenseDate: validatedData.expenseDate || new Date(),
          category: validatedData.category,
          amount: validatedData.amount,
          description: validatedData.description,
        },
      })

      // Update distributor totals
      await tx.distributor.update({
        where: { id: params.id },
        data: {
          totalExpenses: { increment: validatedData.amount },
          totalProfit: { decrement: validatedData.amount },
        },
      })

      return newExpense
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        module: 'DISTRIBUTOR',
        description: `Added expense for distributor: ${distributor.name}`,
      },
    })

    return NextResponse.json({
      success: true,
      data: expense,
      message: 'Expense added successfully',
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
