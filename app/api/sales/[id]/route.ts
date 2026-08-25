import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'

// GET /api/sales/:id - Get sale by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const sale = await db.sale.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
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

    if (!sale) {
      return NextResponse.json(
        { success: false, error: 'Sale not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: sale,
    })
  } catch (error) {
    return handleError(error)
  }
}

// DELETE /api/sales/:id - Delete sale (with stock rollback)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    // Only admin can delete sales
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only admin can delete sales' },
        { status: 403 }
      )
    }

    const sale = await db.sale.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        payments: true,
      },
    })

    if (!sale) {
      return NextResponse.json(
        { success: false, error: 'Sale not found' },
        { status: 404 }
      )
    }

    // Delete sale and rollback stock in transaction
    await db.$transaction(async (tx) => {
      // Rollback stock for each item
      for (const item of sale.items) {
        // Find or create batch to restore stock
        if (item.batchNumber) {
          const batch = await tx.medicineBatch.findFirst({
            where: {
              medicineId: item.medicineId,
              batchNumber: item.batchNumber,
            },
          })

          if (batch) {
            // Update existing batch
            await tx.medicineBatch.update({
              where: { id: batch.id },
              data: {
                quantity: batch.quantity + item.quantity,
              },
            })
          } else {
            // Create new batch if deleted
            await tx.medicineBatch.create({
              data: {
                medicineId: item.medicineId,
                batchNumber: item.batchNumber,
                expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
                quantity: item.quantity,
                purchasePrice: parseFloat(item.salePrice.toString()) * 0.7, // Estimate
                salePrice: item.salePrice,
                mrp: item.mrp,
              },
            })
          }
        } else {
          // Find any batch and restore
          const batch = await tx.medicineBatch.findFirst({
            where: {
              medicineId: item.medicineId,
            },
            orderBy: { expiryDate: 'asc' },
          })

          if (batch) {
            await tx.medicineBatch.update({
              where: { id: batch.id },
              data: {
                quantity: batch.quantity + item.quantity,
              },
            })
          }
        }
      }

      // Update customer totals if customer exists
      if (sale.customerId) {
        await tx.customer.update({
          where: { id: sale.customerId },
          data: {
            totalSales: { decrement: parseFloat(sale.totalAmount.toString()) },
            totalPaid: { decrement: parseFloat(sale.paidAmount.toString()) },
            dueAmount: { decrement: parseFloat(sale.dueAmount.toString()) },
          },
        })
      }

      // Delete payments
      await tx.payment.deleteMany({
        where: { saleId: sale.id },
      })

      // Delete sale items
      await tx.saleItem.deleteMany({
        where: { saleId: sale.id },
      })

      // Delete sale
      await tx.sale.delete({
        where: { id: params.id },
      })
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        module: 'SALE',
        description: `Deleted sale: ${sale.invoiceNumber}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Sale deleted successfully',
    })
  } catch (error) {
    return handleError(error)
  }
}
