import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'

// GET /api/reports/profit-loss - Get profit and loss report
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      dateFilter.lte = end
    }

    // Sales Revenue
    const salesWhere: any = {}
    if (Object.keys(dateFilter).length > 0) {
      salesWhere.saleDate = dateFilter
    }

    const salesData = await db.sale.findMany({
      where: salesWhere,
      include: {
        items: {
          include: {
            medicine: {
              include: {
                batches: {
                  take: 1,
                  orderBy: { expiryDate: 'asc' },
                },
              },
            },
          },
        },
      },
    })

    let totalRevenue = 0
    let totalCostOfGoodsSold = 0

    salesData.forEach((sale) => {
      totalRevenue += parseFloat(sale.totalAmount.toString())

      sale.items.forEach((item) => {
        const batch = item.medicine.batches[0]
        if (batch) {
          totalCostOfGoodsSold += item.quantity * parseFloat(batch.purchasePrice.toString())
        } else {
          // Estimate if no batch found (70% of sale price)
          totalCostOfGoodsSold += item.quantity * parseFloat(item.salePrice.toString()) * 0.7
        }
      })
    })

    const grossProfit = totalRevenue - totalCostOfGoodsSold
    const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

    // Operating Expenses
    const expensesWhere: any = {}
    if (Object.keys(dateFilter).length > 0) {
      expensesWhere.expenseDate = dateFilter
    }

    const [expenses, expensesByCategory] = await Promise.all([
      db.expense.aggregate({
        where: expensesWhere,
        _sum: { amount: true },
        _count: true,
      }),
      db.expense.groupBy({
        by: ['category'],
        where: expensesWhere,
        _sum: { amount: true },
        _count: true,
      }),
    ])

    const totalExpenses = expenses._sum.amount ? parseFloat(expenses._sum.amount.toString()) : 0

    // Distributor Expenses
    const distExpensesWhere: any = {}
    if (Object.keys(dateFilter).length > 0) {
      distExpensesWhere.expenseDate = dateFilter
    }

    const distributorExpenses = await db.distributorExpense.aggregate({
      where: distExpensesWhere,
      _sum: { amount: true },
    })

    const totalDistributorExpenses = distributorExpenses._sum.amount 
      ? parseFloat(distributorExpenses._sum.amount.toString()) 
      : 0

    const totalOperatingExpenses = totalExpenses + totalDistributorExpenses

    // Net Profit
    const netProfit = grossProfit - totalOperatingExpenses
    const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    // Other Income (Distributor Sales)
    const distSalesWhere: any = {}
    if (Object.keys(dateFilter).length > 0) {
      distSalesWhere.saleDate = dateFilter
    }

    const distributorSales = await db.distributorSale.aggregate({
      where: distSalesWhere,
      _sum: {
        amount: true,
        profit: true,
      },
    })

    const distributorRevenue = distributorSales._sum.amount 
      ? parseFloat(distributorSales._sum.amount.toString()) 
      : 0
    const distributorProfit = distributorSales._sum.profit 
      ? parseFloat(distributorSales._sum.profit.toString()) 
      : 0

    // Total Business Profit
    const totalBusinessRevenue = totalRevenue + distributorRevenue
    const totalBusinessProfit = netProfit + distributorProfit - totalDistributorExpenses

    return NextResponse.json({
      success: true,
      data: {
        revenue: {
          pharmacySales: totalRevenue,
          distributorSales: distributorRevenue,
          totalRevenue: totalBusinessRevenue,
        },
        costOfGoodsSold: totalCostOfGoodsSold,
        grossProfit: {
          amount: grossProfit,
          margin: grossProfitMargin,
        },
        operatingExpenses: {
          pharmacyExpenses: totalExpenses,
          distributorExpenses: totalDistributorExpenses,
          totalExpenses: totalOperatingExpenses,
          breakdown: expensesByCategory.map((item) => ({
            category: item.category,
            amount: item._sum.amount ? parseFloat(item._sum.amount.toString()) : 0,
            count: item._count,
          })),
        },
        netProfit: {
          pharmacyProfit: netProfit,
          distributorProfit: distributorProfit - totalDistributorExpenses,
          totalProfit: totalBusinessProfit,
          margin: totalBusinessRevenue > 0 ? (totalBusinessProfit / totalBusinessRevenue) * 100 : 0,
        },
        summary: {
          totalRevenue: totalBusinessRevenue,
          totalCosts: totalCostOfGoodsSold + totalOperatingExpenses,
          totalProfit: totalBusinessProfit,
          profitMargin: totalBusinessRevenue > 0 ? (totalBusinessProfit / totalBusinessRevenue) * 100 : 0,
        },
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
