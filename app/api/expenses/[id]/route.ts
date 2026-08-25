import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'
import { z } from 'zod'

const updateExpenseSchema = z.object({
  expenseDate: z.string().transform((str) => new Date(str)).optional(),
  category: z.string().min(1).optional(),
  amount: z.number().min(0.01).optional(),
  description: z.string().optional(),
})

// GET /api/expenses/:id - Get expense by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const expense = await db.expense.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            username: true,
            fullName: true,
          },
        },
      },
    })

    if (!expense) {
      return NextResponse.json(
        { success: false, error: 'Expense not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: expense,
    })
  } catch (error) {
    return handleError(error)
  }
}

// PUT /api/expenses/:id - Update expense
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const validatedData = updateExpenseSchema.parse(body)

    const existingExpense = await db.expense.findUnique({
      where: { id: params.id },
    })

    if (!existingExpense) {
      return NextResponse.json(
        { success: false, error: 'Expense not found' },
        { status: 404 }
      )
    }

    const expense = await db.expense.update({
      where: { id: params.id },
      data: validatedData,
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        module: 'EXPENSE',
        description: `Updated expense: ${expense.category}`,
      },
    })

    return NextResponse.json({
      success: true,
      data: expense,
      message: 'Expense updated successfully',
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

// DELETE /api/expenses/:id - Delete expense
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const expense = await db.expense.findUnique({
      where: { id: params.id },
    })

    if (!expense) {
      return NextResponse.json(
        { success: false, error: 'Expense not found' },
        { status: 404 }
      )
    }

    await db.expense.delete({
      where: { id: params.id },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        module: 'EXPENSE',
        description: `Deleted expense: ${expense.category}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully',
    })
  } catch (error) {
    return handleError(error)
  }
}
