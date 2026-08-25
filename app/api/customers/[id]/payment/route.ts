import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'
import { z } from 'zod'

const paymentSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['cash', 'card', 'online', 'bank']),
  paymentDate: z.string().transform((str) => new Date(str)).optional(),
  notes: z.string().optional(),
})

// POST /api/customers/:id/payment - Add payment for customer (clear dues)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const validatedData = paymentSchema.parse(body)

    // Get customer
    const customer = await db.customer.findUnique({
      where: { id: params.id },
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Check if payment amount exceeds due amount
    const dueAmount = parseFloat(customer.dueAmount.toString())
    if (validatedData.amount > dueAmount) {
      return NextResponse.json(
        { success: false, error: `Payment amount cannot exceed due amount: ${dueAmount}` },
        { status: 400 }
      )
    }

    // Get pending and partial sales to allocate payment
    const pendingSales = await db.sale.findMany({
      where: {
        customerId: params.id,
        paymentStatus: { in: ['pending', 'partial'] },
        dueAmount: { gt: 0 },
      },
      orderBy: { saleDate: 'asc' },
    })

    // Create payment and update customer/sales in transaction
    const payment = await db.$transaction(async (tx) => {
      // Create payment
      const newPayment = await tx.payment.create({
        data: {
          paymentDate: validatedData.paymentDate || new Date(),
          amount: validatedData.amount,
          paymentMethod: validatedData.paymentMethod,
          paymentType: 'customer',
          customerId: params.id,
          notes: validatedData.notes,
          userId: session.user.id,
        },
      })

      // Allocate payment to pending sales (FIFO)
      let remainingAmount = validatedData.amount

      for (const sale of pendingSales) {
        if (remainingAmount <= 0) break

        const saleDue = parseFloat(sale.dueAmount.toString())
        const paymentForSale = Math.min(remainingAmount, saleDue)

        const newPaidAmount = parseFloat(sale.paidAmount.toString()) + paymentForSale
        const newDueAmount = parseFloat(sale.dueAmount.toString()) - paymentForSale
        const newPaymentStatus = newDueAmount <= 0 ? 'paid' : 'partial'

        await tx.sale.update({
          where: { id: sale.id },
          data: {
            paidAmount: newPaidAmount,
            dueAmount: newDueAmount,
            paymentStatus: newPaymentStatus,
          },
        })

        remainingAmount -= paymentForSale
      }

      // Update customer
      await tx.customer.update({
        where: { id: params.id },
        data: {
          totalPaid: { increment: validatedData.amount },
          dueAmount: { decrement: validatedData.amount },
        },
      })

      return newPayment
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        module: 'PAYMENT',
        description: `Added payment for customer: ${customer.name}`,
      },
    })

    return NextResponse.json({
      success: true,
      data: payment,
      message: 'Payment added successfully',
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
