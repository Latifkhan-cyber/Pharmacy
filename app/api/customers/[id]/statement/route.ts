import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'

// GET /api/customers/:id/statement - Get customer statement
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

    const customer = await db.customer.findUnique({
      where: { id: params.id },
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
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
    const sales = await db.sale.findMany({
      where: {
        customerId: params.id,
        ...(Object.keys(dateFilter).length > 0 && { saleDate: dateFilter }),
      },
      orderBy: { saleDate: 'asc' },
      include: {
        items: {
          include: {
            medicine: {
              select: {
                name: true,
                unitType: true,
              },
            },
          },
        },
      },
    })

    // Get payments
    const payments = await db.payment.findMany({
      where: {
        customerId: params.id,
        paymentType: 'customer',
        ...(Object.keys(dateFilter).length > 0 && { paymentDate: dateFilter }),
      },
      orderBy: { paymentDate: 'asc' },
      include: {
        sale: {
          select: {
            invoiceNumber: true,
          },
        },
      },
    })

    // Combine and sort transactions
    const transactions: any[] = []

    sales.forEach((sale) => {
      transactions.push({
        type: 'sale',
        date: sale.saleDate,
        reference: sale.invoiceNumber,
        description: `Sale - ${sale.items.length} items`,
        debit: parseFloat(sale.totalAmount.toString()),
        credit: 0,
        balance: 0,
        details: sale,
      })
    })

    payments.forEach((payment) => {
      transactions.push({
        type: 'payment',
        date: payment.paymentDate,
        reference: payment.sale?.invoiceNumber || 'Direct Payment',
        description: `Payment - ${payment.paymentMethod}`,
        debit: 0,
        credit: parseFloat(payment.amount.toString()),
        balance: 0,
        details: payment,
      })
    })

    // Sort by date
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Calculate running balance
    let runningBalance = 0
    transactions.forEach((transaction) => {
      runningBalance += transaction.debit - transaction.credit
      transaction.balance = runningBalance
    })

    // Calculate summary
    const totalSales = sales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount.toString()), 0)
    const totalPayments = payments.reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0)
    const currentBalance = parseFloat(customer.dueAmount.toString())

    return NextResponse.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
        },
        summary: {
          totalSales,
          totalPayments,
          currentBalance,
          transactionCount: transactions.length,
          salesCount: sales.length,
          paymentsCount: payments.length,
        },
        transactions,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
