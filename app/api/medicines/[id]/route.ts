import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'
import { z } from 'zod'

const updateMedicineSchema = z.object({
  name: z.string().min(1).optional(),
  genericName: z.string().optional(),
  category: z.string().min(1).optional(),
  manufacturer: z.string().optional(),
  description: z.string().optional(),
  unitType: z.string().min(1).optional(),
  reorderLevel: z.number().int().min(0).optional(),
  barcode: z.string().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/medicines/:id - Get medicine by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const medicine = await db.medicine.findUnique({
      where: { id: params.id },
      include: {
        batches: {
          where: {
            quantity: { gt: 0 },
          },
          orderBy: { expiryDate: 'asc' },
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            batches: true,
            saleItems: true,
            purchaseItems: true,
          },
        },
      },
    })

    if (!medicine) {
      return NextResponse.json(
        { success: false, error: 'Medicine not found' },
        { status: 404 }
      )
    }

    // Calculate total stock
    const totalStock = medicine.batches.reduce((sum, batch) => sum + batch.quantity, 0)

    return NextResponse.json({
      success: true,
      data: {
        ...medicine,
        totalStock,
        isLowStock: totalStock <= medicine.reorderLevel,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}

// PUT /api/medicines/:id - Update medicine
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const validatedData = updateMedicineSchema.parse(body)

    const existingMedicine = await db.medicine.findUnique({
      where: { id: params.id },
    })

    if (!existingMedicine) {
      return NextResponse.json(
        { success: false, error: 'Medicine not found' },
        { status: 404 }
      )
    }

    // Check name uniqueness if updating
    if (validatedData.name && validatedData.name !== existingMedicine.name) {
      const nameExists = await db.medicine.findFirst({
        where: {
          name: {
            equals: validatedData.name,
            mode: 'insensitive',
          },
          NOT: { id: params.id },
        },
      })
      if (nameExists) {
        return NextResponse.json(
          { success: false, error: 'Medicine with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Check barcode uniqueness if updating
    if (validatedData.barcode && validatedData.barcode !== existingMedicine.barcode) {
      const barcodeExists = await db.medicine.findFirst({
        where: {
          barcode: validatedData.barcode,
          NOT: { id: params.id },
        },
      })
      if (barcodeExists) {
        return NextResponse.json(
          { success: false, error: 'Barcode already exists' },
          { status: 400 }
        )
      }
    }

    const medicine = await db.medicine.update({
      where: { id: params.id },
      data: validatedData,
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        module: 'MEDICINE',
        description: `Updated medicine: ${medicine.name}`,
      },
    })

    return NextResponse.json({
      success: true,
      data: medicine,
      message: 'Medicine updated successfully',
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

// DELETE /api/medicines/:id - Delete medicine
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const medicine = await db.medicine.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            saleItems: true,
            purchaseItems: true,
          },
        },
      },
    })

    if (!medicine) {
      return NextResponse.json(
        { success: false, error: 'Medicine not found' },
        { status: 404 }
      )
    }

    // Check if medicine has transactions
    if (medicine._count.saleItems > 0 || medicine._count.purchaseItems > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete medicine with existing transactions. Consider deactivating it instead.' 
        },
        { status: 400 }
      )
    }

    await db.medicine.delete({
      where: { id: params.id },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        module: 'MEDICINE',
        description: `Deleted medicine: ${medicine.name}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Medicine deleted successfully',
    })
  } catch (error) {
    return handleError(error)
  }
}
