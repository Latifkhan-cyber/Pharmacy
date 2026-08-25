import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'

// GET /api/distributors/summary - Get distributors summary
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Total distributors
    const totalDistributors = await db.distributor.count({
      where: { isActive: true },
    })

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

    // Sales summary
    const salesWhere: any = {}
    if (Object.keys(dateFilter).length > 0) {
      salesWhere.saleDate = dateFilter
    }

    const salesSummary = await db.distributorSale.aggregate({
      where: salesWhere,
      _sum: {
        amount: true,
        cost: true,
        profit: true,
      },
      _count: true,
    })

    // Expenses summary
    const expensesWhere: any = {}
    if (Object.keys(dateFilter).length > 0) {
      expensesWhere.expenseDate = dateFilter
    }

    const expensesSummary = await db.distributorExpense.aggregate({
      where: expensesWhere,
      _sum: {
        amount: true,
      },
      _count: true,
    })

    // Top distributors by sales
    const distributors = await db.distributor.findMany({
      where: { isActive: true },
      include: {
        sales: {
          where: salesWhere,
        },
        expenses: {
          where: expensesWhere,
        },
      },
    })

    const distributorsWithMetrics = distributors.map((dist) => {
      const totalSales = dist.sales.reduce((sum, sale) => sum + parseFloat(sale.amount.toString()), 0)
      const totalProfit = dist.sales.reduce((sum, sale) => sum + parseFloat(sale.profit.toString()), 0)
      const totalExpenses = dist.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0)
      const netProfit = totalProfit - totalExpenses

      return {
        id: dist.id,
        name: dist.name,
        phone: dist.phone,
        area: dist.area,
        city: dist.city,
        totalSales,
        totalProfit,
        totalExpenses,
        netProfit,
        salesCount: dist.sales.length,
        expensesCount: dist.expenses.length,
      }
    })

    // Sort by sales and get top 10
    const topDistributorsBySales = distributorsWithMetrics
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 10)

    // Sort by profit and get top 10
    const topDistributorsByProfit = distributorsWithMetrics
      .sort((a, b) => b.netProfit - a.netProfit)
      .slice(0, 10)

    // Distributors by area/city
    const distributorsByArea = await db.distributor.groupBy({
      by: ['area'],
      where: {
        isActive: true,
        area: { not: null },
      },
      _count: true,
    })

    const distributorsByCity = await db.distributor.groupBy({
      by: ['city'],
      where: {
        isActive: true,
        city: { not: null },
      },
      _count: true,
    })

    // Calculate totals
    const totalSales = salesSummary._sum.amount ? parseFloat(salesSummary._sum.amount.toString()) : 0
    const totalCost = salesSummary._sum.cost ? parseFloat(salesSummary._sum.cost.toString()) : 0
    const grossProfit = salesSummary._sum.profit ? parseFloat(salesSummary._sum.profit.toString()) : 0
    const totalExpenses = expensesSummary._sum.amount ? parseFloat(expensesSummary._sum.amount.toString()) : 0
    const netProfit = grossProfit - totalExpenses

    return NextResponse.json({
      success: true,
      data: {
        totalDistributors,
        activeDistributors: totalDistributors,
        summary: {
          totalSales,
          totalCost,
          grossProfit,
          totalExpenses,
          netProfit,
          profitMargin: totalSales > 0 ? (netProfit / totalSales) * 100 : 0,
          salesCount: salesSummary._count,
          expensesCount: expensesSummary._count,
          averageSalePerDistributor: totalDistributors > 0 ? totalSales / totalDistributors : 0,
          averageProfitPerDistributor: totalDistributors > 0 ? netProfit / totalDistributors : 0,
        },
        topDistributorsBySales,
        topDistributorsByProfit,
        distributorsByArea: distributorsByArea.map((item) => ({
          area: item.area || 'Unknown',
          count: item._count,
        })),
        distributorsByCity: distributorsByCity.map((item) => ({
          city: item.city || 'Unknown',
          count: item._count,
        })),
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
