import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'

// GET /api/expenses/categories - Get all expense categories
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    // Get categories from settings
    const settings = await db.setting.findMany({
      where: {
        key: {
          startsWith: 'expense_category_',
        },
      },
    })

    const categories = settings.map((setting) => setting.value)

    // Get categories from existing expenses
    const expenseCategories = await db.expense.findMany({
      select: {
        category: true,
      },
      distinct: ['category'],
    })

    const existingCategories = expenseCategories.map((e) => e.category)

    // Combine and remove duplicates
    const allCategories = Array.from(new Set([...categories, ...existingCategories]))

    return NextResponse.json({
      success: true,
      data: allCategories.sort(),
    })
  } catch (error) {
    return handleError(error)
  }
}
