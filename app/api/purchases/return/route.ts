import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'
import { z } from 'zod'

const returnItemSchema = z.object({
  medicineId: z.string().min(1),
  batchNumber: z.string().min(1),
  quantity: z.number().int().min(1),
})

const purchaseReturnSchema = z.object({
  purchaseId: z.string().min(1),
  items: z.array(returnItemSchema).min(1),
  reason: z.string().optional(),
})

// POST /api/purchases/return - Handle purchase return
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const validatedData = purchaseReturnSchema.parse(body)

    // Get purchase
    const purchase = await db.purchase.findUnique({
      where: { id: validatedData.purchaseId },
      include: {
        items: true,
      },
    })

    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Purchase not found' },
        { status: 404 }
      )
    }

    // Validate return items
    for (const returnItem of validatedData.items) {
      const purchaseItem = purchase.items.find(
        (item) => item.medicineId === returnItem.medicineId && 
                 item.batchNumber === returnItem.batchNumber
      )

      if (!purchaseItem) {
        return NextResponse.json(
          { success: false, error: `Item not found in purchase: ${returnItem.medicineId}` },
          { status: 400 }
        )
      }

      if (returnItem.quantity > purchaseItem.quantity) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Return quantity cannot exceed purchased quantity for item: ${returnItem.medicineId}` 
          },
          { status: 400 }
        )
      }
    }

    // Process return in transaction
    let totalReturnAmount = 0

    await db.$transaction(async (tx) => {
      // Update stock for each return item
      for (const returnItem of validatedData.items) {
        const batch = await tx.medicineBatch.findFirst({
          where: {
            medicineId: returnItem.medicineId,
            batchNumber: returnItem.batchNumber,
          },
        })

        if (batch) {
          const newQuantity = batch.quantity - returnItem.quantity
          
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

          // Calculate return amount
          totalReturnAmount += returnItem.quantity * parseFloat(batch.purchasePrice.toString())
        }
      }

      // Update purchase totals
      const newTotalAmount = parseFloat(purchase.totalAmount.toString()) - totalReturnAmount
      const newPaidAmount = Math.min(parseFloat(purchase.paidAmount.toString()), newTotalAmount)
      const newDueAmount = newTotalAmount - newPaidAmount

      await tx.purchase.update({
        where: { id: validatedData.purchaseId },
        data: {
          totalAmount: newTotalAmount,
          subtotal: parseFloat(purchase.subtotal.toString()) - totalReturnAmount,
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount,
          paymentStatus: newDueAmount <= 0 ? 'paid' : 'partial',
          notes: purchase.notes 
            ? `${purchase.notes}\n[Return] ${validatedData.reason || 'Items returned'}`
            : `[Return] ${validatedData.reason || 'Items returned'}`,
        },
      })

      // Update supplier totals
      await tx.supplier.update({
        where: { id: purchase.supplierId },
        data: {
          totalPurchase: { decrement: totalReturnAmount },
          dueAmount: { decrement: totalReturnAmount - (parseFloat(purchase.paidAmount.toString()) - newPaidAmount) },
        },
      })
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        module: 'PURCHASE',
        description: `Processed return for purchase: ${purchase.invoiceNumber}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Purchase return processed successfully',
      returnAmount: totalReturnAmount,
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
