import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'
import { z } from 'zod'

const updateBatchSchema = z.object({
  batchNumber: z.string().min(1).optional(),
  expiryDate: z.string().transform((str) => new Date(str)).optional(),
  quantity: z.number().int().min(0).optional(),
  purchasePrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
  mrp: z.number().min(0).optional(),
  supplierId: z.string().optional(),
})

// GET /api/batches/:id - Get batch by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const batch = await db.medicineBatch.findUnique({
      where: { id: params.id },
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
        supplier: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    })

    if (!batch) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      )
    }

    const today = new Date()
    const batchWithStatus = {
      ...batch,
      isExpired: batch.expiryDate < today,
      isExpiringSoon: batch.expiryDate >= today && 
                     batch.expiryDate <= new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000),
    }

    return NextResponse.json({
      success: true,
      data: batchWithStatus,
    })
  } catch (error) {
    return handleError(error)
  }
}

// PUT /api/batches/:id - Update batch
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const validatedData = updateBatchSchema.parse(body)

    const existingBatch = await db.medicineBatch.findUnique({
      where: { id: params.id },
      include: {
        medicine: true,
      },
    })

    if (!existingBatch) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      )
    }

    const batch = await db.medicineBatch.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        medicine: {
          select: {
            name: true,
          },
        },
      },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        module: 'BATCH',
        description: `Updated batch for ${batch.medicine.name}: ${batch.batchNumber}`,
      },
    })

    return NextResponse.json({
      success: true,
      data: batch,
      message: 'Batch updated successfully',
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

// DELETE /api/batches/:id - Delete batch
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const batch = await db.medicineBatch.findUnique({
      where: { id: params.id },
      include: {
        medicine: true,
      },
    })

    if (!batch) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      )
    }

    // Only allow deletion if quantity is 0
    if (batch.quantity > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete batch with remaining quantity. Update quantity to 0 first.' 
        },
        { status: 400 }
      )
    }

    await db.medicineBatch.delete({
      where: { id: params.id },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        module: 'BATCH',
        description: `Deleted batch for ${batch.medicine.name}: ${batch.batchNumber}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Batch deleted successfully',
    })
  } catch (error) {
    return handleError(error)
  }
}
