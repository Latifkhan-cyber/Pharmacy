import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'

// GET /api/payments/:id - Get payment by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const payment = await db.payment.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        supplier: true,
        sale: {
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
        },
        purchase: {
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
        },
        user: {
          select: {
            username: true,
            fullName: true,
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: payment,
    })
  } catch (error) {
    return handleError(error)
  }
}

// DELETE /api/payments/:id - Delete payment (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    // Only admin can delete payments
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only admin can delete payments' },
        { status: 403 }
      )
    }

    const payment = await db.payment.findUnique({
      where: { id: params.id },
    })

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Rollback payment in transaction
    await db.$transaction(async (tx) => {
      const amount = parseFloat(payment.amount.toString())

      if (payment.paymentType === 'customer') {
        // Update customer
        if (payment.customerId) {
          await tx.customer.update({
            where: { id: payment.customerId },
            data: {
              totalPaid: { decrement: amount },
              dueAmount: { increment: amount },
            },
          })
        }

        // Update sale
        if (payment.saleId) {
          const sale = await tx.sale.findUnique({
            where: { id: payment.saleId },
          })

          if (sale) {
            const newPaidAmount = parseFloat(sale.paidAmount.toString()) - amount
            const newDueAmount = parseFloat(sale.dueAmount.toString()) + amount

            await tx.sale.update({
              where: { id: payment.saleId },
              data: {
                paidAmount: newPaidAmount,
                dueAmount: newDueAmount,
                paymentStatus: newDueAmount > 0 ? 'partial' : 'paid',
              },
            })
          }
        }
      } else if (payment.paymentType === 'supplier') {
        // Update supplier
        if (payment.supplierId) {
          await tx.supplier.update({
            where: { id: payment.supplierId },
            data: {
              totalPaid: { decrement: amount },
              dueAmount: { increment: amount },
            },
          })
        }

        // Update purchase
        if (payment.purchaseId) {
          const purchase = await tx.purchase.findUnique({
            where: { id: payment.purchaseId },
          })

          if (purchase) {
            const newPaidAmount = parseFloat(purchase.paidAmount.toString()) - amount
            const newDueAmount = parseFloat(purchase.dueAmount.toString()) + amount

            await tx.purchase.update({
              where: { id: payment.purchaseId },
              data: {
                paidAmount: newPaidAmount,
                dueAmount: newDueAmount,
                paymentStatus: newDueAmount > 0 ? 'partial' : 'paid',
              },
            })
          }
        }
      }

      // Delete payment
      await tx.payment.delete({
        where: { id: params.id },
      })
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        module: 'PAYMENT',
        description: `Deleted payment: ${payment.id}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Payment deleted successfully',
    })
  } catch (error) {
    return handleError(error)
  }
}
