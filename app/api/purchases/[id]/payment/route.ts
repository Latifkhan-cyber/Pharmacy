import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'
import { z } from 'zod'

const paymentSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['cash', 'bank', 'online', 'card']),
  paymentDate: z.string().transform((str) => new Date(str)).optional(),
  notes: z.string().optional(),
})

// POST /api/purchases/:id/payment - Add payment to purchase
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const validatedData = paymentSchema.parse(body)

    // Get purchase
    const purchase = await db.purchase.findUnique({
      where: { id: params.id },
    })

    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Purchase not found' },
        { status: 404 }
      )
    }

    // Check if payment amount exceeds due amount
    const dueAmount = parseFloat(purchase.dueAmount.toString())
    if (validatedData.amount > dueAmount) {
      return NextResponse.json(
        { success: false, error: `Payment amount cannot exceed due amount: ${dueAmount}` },
        { status: 400 }
      )
    }

    // Create payment and update purchase in transaction
    const payment = await db.$transaction(async (tx) => {
      // Create payment
      const newPayment = await tx.payment.create({
        data: {
          paymentDate: validatedData.paymentDate || new Date(),
          amount: validatedData.amount,
          paymentMethod: validatedData.paymentMethod,
          paymentType: 'supplier',
          supplierId: purchase.supplierId,
          purchaseId: purchase.id,
          notes: validatedData.notes,
          userId: session.user.id,
        },
      })

      // Update purchase
      const newPaidAmount = parseFloat(purchase.paidAmount.toString()) + validatedData.amount
      const newDueAmount = parseFloat(purchase.dueAmount.toString()) - validatedData.amount
      const newPaymentStatus = newDueAmount <= 0 ? 'paid' : 'partial'

      await tx.purchase.update({
        where: { id: params.id },
        data: {
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount,
          paymentStatus: newPaymentStatus,
        },
      })

      // Update supplier
      await tx.supplier.update({
        where: { id: purchase.supplierId },
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
        description: `Added payment for purchase: ${purchase.invoiceNumber}`,
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
