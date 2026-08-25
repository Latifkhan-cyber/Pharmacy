import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'

// GET /api/expenses/summary - Get expenses summary
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

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

    // Total expenses
    const totalExpenses = await db.expense.aggregate({
      where,
      _sum: {
        amount: true,
      },
      _count: true,
    })

    // Expenses by category
    const expensesByCategory = await db.expense.groupBy({
      by: ['category'],
      where,
      _sum: {
        amount: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
    })

    // Daily expenses trend
    const expenses = await db.expense.findMany({
      where,
      select: {
        expenseDate: true,
        amount: true,
        category: true,
      },
      orderBy: { expenseDate: 'asc' },
    })

    const dailyTrend: Record<string, number> = {}
    const categoryTrend: Record<string, Record<string, number>> = {}

    expenses.forEach((expense) => {
      const dateKey = expense.expenseDate.toISOString().split('T')[0]
      const amount = parseFloat(expense.amount.toString())

      // Daily total
      if (!dailyTrend[dateKey]) {
        dailyTrend[dateKey] = 0
      }
      dailyTrend[dateKey] += amount

      // Category-wise daily
      if (!categoryTrend[expense.category]) {
        categoryTrend[expense.category] = {}
      }
      if (!categoryTrend[expense.category][dateKey]) {
        categoryTrend[expense.category][dateKey] = 0
      }
      categoryTrend[expense.category][dateKey] += amount
    })

    const trend = Object.entries(dailyTrend).map(([date, amount]) => ({
      date,
      amount,
    })).sort((a, b) => a.date.localeCompare(b.date))

    // Top expenses
    const topExpenses = await db.expense.findMany({
      where,
      take: 10,
      orderBy: { amount: 'desc' },
      include: {
        user: {
          select: {
            username: true,
            fullName: true,
          },
        },
      },
    })

    // This month vs last month
    const today = new Date()
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999)

    const [thisMonth, lastMonth] = await Promise.all([
      db.expense.aggregate({
        where: {
          expenseDate: { gte: thisMonthStart },
        },
        _sum: { amount: true },
        _count: true,
      }),
      db.expense.aggregate({
        where: {
          expenseDate: { gte: lastMonthStart, lte: lastMonthEnd },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ])

    const thisMonthAmount = thisMonth._sum.amount ? parseFloat(thisMonth._sum.amount.toString()) : 0
    const lastMonthAmount = lastMonth._sum.amount ? parseFloat(lastMonth._sum.amount.toString()) : 0
    const monthChange = lastMonthAmount > 0 
      ? ((thisMonthAmount - lastMonthAmount) / lastMonthAmount) * 100 
      : 0

    return NextResponse.json({
      success: true,
      data: {
        totalExpenses: {
          amount: totalExpenses._sum.amount ? parseFloat(totalExpenses._sum.amount.toString()) : 0,
          count: totalExpenses._count,
        },
        expensesByCategory: expensesByCategory.map((item) => ({
          category: item.category,
          amount: item._sum.amount ? parseFloat(item._sum.amount.toString()) : 0,
          count: item._count,
          percentage: totalExpenses._sum.amount 
            ? ((item._sum.amount ? parseFloat(item._sum.amount.toString()) : 0) / parseFloat(totalExpenses._sum.amount.toString())) * 100
            : 0,
        })),
        trend,
        topExpenses: topExpenses.map((exp) => ({
          ...exp,
          amount: parseFloat(exp.amount.toString()),
        })),
        comparison: {
          thisMonth: {
            amount: thisMonthAmount,
            count: thisMonth._count,
          },
          lastMonth: {
            amount: lastMonthAmount,
            count: lastMonth._count,
          },
          change: monthChange,
        },
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
