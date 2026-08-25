import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'

// GET /api/purchases/:id - Get purchase by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const purchase = await db.purchase.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        items: {
          include: {
            medicine: {
              select: {
                id: true,
                name: true,
                genericName: true,
                category: true,
                unitType: true,
              },
            },
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          include: {
            user: {
              select: {
                username: true,
                fullName: true,
              },
            },
          },
        },
      },
    })

    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Purchase not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: purchase,
    })
  } catch (error) {
    return handleError(error)
  }
}

// DELETE /api/purchases/:id - Delete purchase (with rollback)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    // Only admin can delete purchases
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only admin can delete purchases' },
        { status: 403 }
      )
    }

    const purchase = await db.purchase.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        payments: true,
      },
    })

    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Purchase not found' },
        { status: 404 }
      )
    }

    // Delete purchase and rollback stock in transaction
    await db.$transaction(async (tx) => {
      // Rollback stock for each item
      for (const item of purchase.items) {
        const batch = await tx.medicineBatch.findFirst({
          where: {
            medicineId: item.medicineId,
            batchNumber: item.batchNumber,
          },
        })

        if (batch) {
          const newQuantity = batch.quantity - item.quantity
          
          if (newQuantity <= 0) {
            // Delete batch if quantity becomes 0 or less
            await tx.medicineBatch.delete({
              where: { id: batch.id },
            })
          } else {
            // Update batch quantity
            await tx.medicineBatch.update({
              where: { id: batch.id },
              data: { quantity: newQuantity },
            })
          }
        }
      }

      // Update supplier totals
      await tx.supplier.update({
        where: { id: purchase.supplierId },
        data: {
          totalPurchase: { decrement: parseFloat(purchase.totalAmount.toString()) },
          totalPaid: { decrement: parseFloat(purchase.paidAmount.toString()) },
          dueAmount: { decrement: parseFloat(purchase.dueAmount.toString()) },
        },
      })

      // Delete payments
      await tx.payment.deleteMany({
        where: { purchaseId: purchase.id },
      })

      // Delete purchase items
      await tx.purchaseItem.deleteMany({
        where: { purchaseId: purchase.id },
      })

      // Delete purchase
      await tx.purchase.delete({
        where: { id: params.id },
      })
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        module: 'PURCHASE',
        description: `Deleted purchase: ${purchase.invoiceNumber}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Purchase deleted successfully',
    })
  } catch (error) {
    return handleError(error)
  }
}
