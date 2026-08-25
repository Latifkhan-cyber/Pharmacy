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

// POST /api/sales/:id/payment - Add payment to sale
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const validatedData = paymentSchema.parse(body)

    // Get sale
    const sale = await db.sale.findUnique({
      where: { id: params.id },
    })

    if (!sale) {
      return NextResponse.json(
        { success: false, error: 'Sale not found' },
        { status: 404 }
      )
    }

    // Check if payment amount exceeds due amount
    const dueAmount = parseFloat(sale.dueAmount.toString())
    if (validatedData.amount > dueAmount) {
      return NextResponse.json(
        { success: false, error: `Payment amount cannot exceed due amount: ${dueAmount}` },
        { status: 400 }
      )
    }

    // Create payment and update sale in transaction
    const payment = await db.$transaction(async (tx) => {
      // Create payment
      const newPayment = await tx.payment.create({
        data: {
          paymentDate: validatedData.paymentDate || new Date(),
          amount: validatedData.amount,
          paymentMethod: validatedData.paymentMethod,
          paymentType: 'customer',
          customerId: sale.customerId,
          saleId: sale.id,
          notes: validatedData.notes,
          userId: session.user.id,
        },
      })

      // Update sale
      const newPaidAmount = parseFloat(sale.paidAmount.toString()) + validatedData.amount
      const newDueAmount = parseFloat(sale.dueAmount.toString()) - validatedData.amount
      const newPaymentStatus = newDueAmount <= 0 ? 'paid' : 'partial'

      await tx.sale.update({
        where: { id: params.id },
        data: {
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount,
          paymentStatus: newPaymentStatus,
        },
      })

      // Update customer if exists
      if (sale.customerId) {
        await tx.customer.update({
          where: { id: sale.customerId },
          data: {
            totalPaid: { increment: validatedData.amount },
            dueAmount: { decrement: validatedData.amount },
          },
        })
      }

      return newPayment
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        module: 'PAYMENT',
        description: `Added payment for sale: ${sale.invoiceNumber}`,
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
