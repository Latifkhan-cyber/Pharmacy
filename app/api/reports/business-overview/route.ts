import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'

// GET /api/reports/business-overview - Get comprehensive business overview
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

    // Sales metrics
    const salesWhere: any = {}
    if (Object.keys(dateFilter).length > 0) {
      salesWhere.saleDate = dateFilter
    }

    const [salesSummary, salesCount] = await Promise.all([
      db.sale.aggregate({
        where: salesWhere,
        _sum: {
          totalAmount: true,
          paidAmount: true,
          dueAmount: true,
        },
      }),
      db.sale.count({ where: salesWhere }),
    ])

    // Purchase metrics
    const purchasesWhere: any = {}
    if (Object.keys(dateFilter).length > 0) {
      purchasesWhere.purchaseDate = dateFilter
    }

    const [purchasesSummary, purchasesCount] = await Promise.all([
      db.purchase.aggregate({
        where: purchasesWhere,
        _sum: {
          totalAmount: true,
          paidAmount: true,
          dueAmount: true,
        },
      }),
      db.purchase.count({ where: purchasesWhere }),
    ])

    // Expense metrics
    const expensesWhere: any = {}
    if (Object.keys(dateFilter).length > 0) {
      expensesWhere.expenseDate = dateFilter
    }

    const expensesSummary = await db.expense.aggregate({
      where: expensesWhere,
      _sum: { amount: true },
      _count: true,
    })

    // Customer metrics
    const [totalCustomers, customersWithDues] = await Promise.all([
      db.customer.count({ where: { isActive: true } }),
      db.customer.count({ where: { isActive: true, dueAmount: { gt: 0 } } }),
    ])

    const customerDues = await db.customer.aggregate({
      where: { isActive: true },
      _sum: { dueAmount: true },
    })

    // Supplier metrics
    const [totalSuppliers, suppliersWithDues] = await Promise.all([
      db.supplier.count({ where: { isActive: true } }),
      db.supplier.count({ where: { isActive: true, dueAmount: { gt: 0 } } }),
    ])

    const supplierDues = await db.supplier.aggregate({
      where: { isActive: true },
      _sum: { dueAmount: true },
    })

    // Inventory metrics
    const medicines = await db.medicine.findMany({
      where: { isActive: true },
      include: {
        batches: {
          where: {
            quantity: { gt: 0 },
            expiryDate: { gte: new Date() },
          },
        },
      },
    })

    let totalInventoryValue = 0
    let lowStockCount = 0

    medicines.forEach((medicine) => {
      const totalStock = medicine.batches.reduce((sum, batch) => sum + batch.quantity, 0)
      medicine.batches.forEach((batch) => {
        totalInventoryValue += batch.quantity * parseFloat(batch.purchasePrice.toString())
      })
      if (totalStock > 0 && totalStock <= medicine.reorderLevel) {
        lowStockCount++
      }
    })

    // Calculate profit
    const totalSales = salesSummary._sum.totalAmount ? parseFloat(salesSummary._sum.totalAmount.toString()) : 0
    const totalPurchases = purchasesSummary._sum.totalAmount ? parseFloat(purchasesSummary._sum.totalAmount.toString()) : 0
    const totalExpenses = expensesSummary._sum.amount ? parseFloat(expensesSummary._sum.amount.toString()) : 0

    // Estimate COGS (approximate)
    const estimatedCOGS = totalPurchases * 0.85 // Rough estimate
    const grossProfit = totalSales - estimatedCOGS
    const netProfit = grossProfit - totalExpenses

    // Payment metrics
    const paymentsWhere: any = {}
    if (Object.keys(dateFilter).length > 0) {
      paymentsWhere.paymentDate = dateFilter
    }

    const [customerPayments, supplierPayments] = await Promise.all([
      db.payment.aggregate({
        where: { ...paymentsWhere, paymentType: 'customer' },
        _sum: { amount: true },
        _count: true,
      }),
      db.payment.aggregate({
        where: { ...paymentsWhere, paymentType: 'supplier' },
        _sum: { amount: true },
        _count: true,
      }),
    ])

    // Distributor metrics
    const [totalDistributors, distributorSales, distributorExpenses] = await Promise.all([
      db.distributor.count({ where: { isActive: true } }),
      db.distributorSale.aggregate({
        where: Object.keys(dateFilter).length > 0 ? { saleDate: dateFilter } : {},
        _sum: { amount: true, profit: true },
        _count: true,
      }),
      db.distributorExpense.aggregate({
        where: Object.keys(dateFilter).length > 0 ? { expenseDate: dateFilter } : {},
        _sum: { amount: true },
        _count: true,
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        sales: {
          totalSales,
          salesCount,
          totalPaid: salesSummary._sum.paidAmount ? parseFloat(salesSummary._sum.paidAmount.toString()) : 0,
          totalDue: salesSummary._sum.dueAmount ? parseFloat(salesSummary._sum.dueAmount.toString()) : 0,
          averageSale: salesCount > 0 ? totalSales / salesCount : 0,
        },
        purchases: {
          totalPurchases,
          purchasesCount,
          totalPaid: purchasesSummary._sum.paidAmount ? parseFloat(purchasesSummary._sum.paidAmount.toString()) : 0,
          totalDue: purchasesSummary._sum.dueAmount ? parseFloat(purchasesSummary._sum.dueAmount.toString()) : 0,
          averagePurchase: purchasesCount > 0 ? totalPurchases / purchasesCount : 0,
        },
        expenses: {
          totalExpenses,
          expensesCount: expensesSummary._count,
          averageExpense: expensesSummary._count > 0 ? totalExpenses / expensesSummary._count : 0,
        },
        profitability: {
          grossProfit,
          netProfit,
          profitMargin: totalSales > 0 ? (netProfit / totalSales) * 100 : 0,
        },
        customers: {
          totalCustomers,
          customersWithDues,
          totalDues: customerDues._sum.dueAmount ? parseFloat(customerDues._sum.dueAmount.toString()) : 0,
        },
        suppliers: {
          totalSuppliers,
          suppliersWithDues,
          totalDues: supplierDues._sum.dueAmount ? parseFloat(supplierDues._sum.dueAmount.toString()) : 0,
        },
        inventory: {
          totalMedicines: medicines.length,
          totalInventoryValue,
          lowStockCount,
        },
        payments: {
          customerPayments: {
            amount: customerPayments._sum.amount ? parseFloat(customerPayments._sum.amount.toString()) : 0,
            count: customerPayments._count,
          },
          supplierPayments: {
            amount: supplierPayments._sum.amount ? parseFloat(supplierPayments._sum.amount.toString()) : 0,
            count: supplierPayments._count,
          },
        },
        distributors: {
          totalDistributors,
          sales: {
            amount: distributorSales._sum.amount ? parseFloat(distributorSales._sum.amount.toString()) : 0,
            profit: distributorSales._sum.profit ? parseFloat(distributorSales._sum.profit.toString()) : 0,
            count: distributorSales._count,
          },
          expenses: {
            amount: distributorExpenses._sum.amount ? parseFloat(distributorExpenses._sum.amount.toString()) : 0,
            count: distributorExpenses._count,
          },
        },
        cashFlow: {
          inflow: totalSales + (customerPayments._sum.amount ? parseFloat(customerPayments._sum.amount.toString()) : 0),
          outflow: totalPurchases + totalExpenses + (supplierPayments._sum.amount ? parseFloat(supplierPayments._sum.amount.toString()) : 0),
          netCashFlow: (totalSales + (customerPayments._sum.amount ? parseFloat(customerPayments._sum.amount.toString()) : 0)) - 
                       (totalPurchases + totalExpenses + (supplierPayments._sum.amount ? parseFloat(supplierPayments._sum.amount.toString()) : 0)),
        },
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
