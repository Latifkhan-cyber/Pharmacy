import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'

// GET /api/distributors/:id/report - Get distributor performance report
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const distributor = await db.distributor.findUnique({
      where: { id: params.id },
    })

    if (!distributor) {
      return NextResponse.json(
        { success: false, error: 'Distributor not found' },
        { status: 404 }
      )
    }

    // Build date filter
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      dateFilter.lte = end
    }

    // Get sales
    const salesWhere: any = { distributorId: params.id }
    if (Object.keys(dateFilter).length > 0) {
      salesWhere.saleDate = dateFilter
    }

    const [sales, salesAgg] = await Promise.all([
      db.distributorSale.findMany({
        where: salesWhere,
        orderBy: { saleDate: 'desc' },
      }),
      db.distributorSale.aggregate({
        where: salesWhere,
        _sum: {
          amount: true,
          cost: true,
          profit: true,
        },
        _count: true,
      }),
    ])

    // Get expenses
    const expensesWhere: any = { distributorId: params.id }
    if (Object.keys(dateFilter).length > 0) {
      expensesWhere.expenseDate = dateFilter
    }

    const [expenses, expensesAgg] = await Promise.all([
      db.distributorExpense.findMany({
        where: expensesWhere,
        orderBy: { expenseDate: 'desc' },
      }),
      db.distributorExpense.aggregate({
        where: expensesWhere,
        _sum: {
          amount: true,
        },
        _count: true,
      }),
    ])

    // Expenses by category
    const expensesByCategory = await db.distributorExpense.groupBy({
      by: ['category'],
      where: expensesWhere,
      _sum: {
        amount: true,
      },
      _count: true,
    })

    // Calculate metrics
    const totalSales = salesAgg._sum.amount ? parseFloat(salesAgg._sum.amount.toString()) : 0
    const totalCost = salesAgg._sum.cost ? parseFloat(salesAgg._sum.cost.toString()) : 0
    const grossProfit = salesAgg._sum.profit ? parseFloat(salesAgg._sum.profit.toString()) : 0
    const totalExpenses = expensesAgg._sum.amount ? parseFloat(expensesAgg._sum.amount.toString()) : 0
    const netProfit = grossProfit - totalExpenses

    const averageSale = salesAgg._count > 0 ? totalSales / salesAgg._count : 0
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0

    // Sales trend (daily)
    const salesByDate: Record<string, { amount: number; profit: number; count: number }> = {}
    
    sales.forEach((sale) => {
      const dateKey = sale.saleDate.toISOString().split('T')[0]
      if (!salesByDate[dateKey]) {
        salesByDate[dateKey] = { amount: 0, profit: 0, count: 0 }
      }
      salesByDate[dateKey].amount += parseFloat(sale.amount.toString())
      salesByDate[dateKey].profit += parseFloat(sale.profit.toString())
      salesByDate[dateKey].count++
    })

    const salesTrend = Object.entries(salesByDate).map(([date, data]) => ({
      date,
      ...data,
    })).sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      success: true,
      data: {
        distributor: {
          id: distributor.id,
          name: distributor.name,
          phone: distributor.phone,
          area: distributor.area,
          city: distributor.city,
        },
        summary: {
          totalSales,
          totalCost,
          grossProfit,
          totalExpenses,
          netProfit,
          averageSale,
          profitMargin,
          salesCount: salesAgg._count,
          expensesCount: expensesAgg._count,
        },
        sales: {
          data: sales,
          trend: salesTrend,
        },
        expenses: {
          data: expenses,
          byCategory: expensesByCategory.map((item) => ({
            category: item.category,
            amount: item._sum.amount ? parseFloat(item._sum.amount.toString()) : 0,
            count: item._count,
          })),
        },
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
