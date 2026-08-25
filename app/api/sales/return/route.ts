import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'
import { z } from 'zod'

const returnItemSchema = z.object({
  medicineId: z.string().min(1),
  batchNumber: z.string().optional(),
  quantity: z.number().int().min(1),
})

const saleReturnSchema = z.object({
  saleId: z.string().min(1),
  items: z.array(returnItemSchema).min(1),
  reason: z.string().optional(),
})

// POST /api/sales/return - Handle sale return
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const validatedData = saleReturnSchema.parse(body)

    // Get sale
    const sale = await db.sale.findUnique({
      where: { id: validatedData.saleId },
      include: {
        items: true,
      },
    })

    if (!sale) {
      return NextResponse.json(
        { success: false, error: 'Sale not found' },
        { status: 404 }
      )
    }

    // Validate return items
    for (const returnItem of validatedData.items) {
      const saleItem = sale.items.find(
        (item) => item.medicineId === returnItem.medicineId
      )

      if (!saleItem) {
        return NextResponse.json(
          { success: false, error: `Item not found in sale: ${returnItem.medicineId}` },
          { status: 400 }
        )
      }

      if (returnItem.quantity > saleItem.quantity) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Return quantity cannot exceed sold quantity for item: ${returnItem.medicineId}` 
          },
          { status: 400 }
        )
      }
    }

    // Process return in transaction
    let totalReturnAmount = 0

    await db.$transaction(async (tx) => {
      // Restore stock for each return item
      for (const returnItem of validatedData.items) {
        const saleItem = sale.items.find((item) => item.medicineId === returnItem.medicineId)
        
        if (saleItem) {
          // Calculate return amount
          const itemReturnAmount = (parseFloat(saleItem.salePrice.toString()) * returnItem.quantity) - 
                                   (parseFloat(saleItem.discount.toString()) * (returnItem.quantity / saleItem.quantity))
          totalReturnAmount += itemReturnAmount

          // Find batch and restore stock
          if (returnItem.batchNumber) {
            const batch = await tx.medicineBatch.findFirst({
              where: {
                medicineId: returnItem.medicineId,
                batchNumber: returnItem.batchNumber,
              },
            })

            if (batch) {
              await tx.medicineBatch.update({
                where: { id: batch.id },
                data: {
                  quantity: batch.quantity + returnItem.quantity,
                },
              })
            } else {
              // Create new batch if not found
              await tx.medicineBatch.create({
                data: {
                  medicineId: returnItem.medicineId,
                  batchNumber: returnItem.batchNumber,
                  expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                  quantity: returnItem.quantity,
                  purchasePrice: parseFloat(saleItem.salePrice.toString()) * 0.7,
                  salePrice: saleItem.salePrice,
                  mrp: saleItem.mrp,
                },
              })
            }
          } else {
            // Find any batch for this medicine
            const batch = await tx.medicineBatch.findFirst({
              where: {
                medicineId: returnItem.medicineId,
              },
              orderBy: { expiryDate: 'asc' },
            })

            if (batch) {
              await tx.medicineBatch.update({
                where: { id: batch.id },
                data: {
                  quantity: batch.quantity + returnItem.quantity,
                },
              })
            }
          }
        }
      }

      // Update sale totals
      const newTotalAmount = parseFloat(sale.totalAmount.toString()) - totalReturnAmount
      const newPaidAmount = Math.min(parseFloat(sale.paidAmount.toString()), newTotalAmount)
      const newDueAmount = newTotalAmount - newPaidAmount

      await tx.sale.update({
        where: { id: validatedData.saleId },
        data: {
          totalAmount: newTotalAmount,
          subtotal: parseFloat(sale.subtotal.toString()) - totalReturnAmount,
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount,
          paymentStatus: newDueAmount <= 0 ? 'paid' : 'partial',
          notes: sale.notes 
            ? `${sale.notes}\n[Return] ${validatedData.reason || 'Items returned'}`
            : `[Return] ${validatedData.reason || 'Items returned'}`,
        },
      })

      // Update customer totals if exists
      if (sale.customerId) {
        await tx.customer.update({
          where: { id: sale.customerId },
          data: {
            totalSales: { decrement: totalReturnAmount },
            dueAmount: { decrement: totalReturnAmount - (parseFloat(sale.paidAmount.toString()) - newPaidAmount) },
          },
        })
      }
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        module: 'SALE',
        description: `Processed return for sale: ${sale.invoiceNumber}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Sale return processed successfully',
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
