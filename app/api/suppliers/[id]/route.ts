import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'
import { z } from 'zod'

const updateSupplierSchema = z.object({
  name: z.string().min(1).optional(),
  contactPerson: z.string().optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/suppliers/:id - Get supplier by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const supplier = await db.supplier.findUnique({
      where: { id: params.id },
      include: {
        purchases: {
          take: 10,
          orderBy: { purchaseDate: 'desc' },
          select: {
            id: true,
            invoiceNumber: true,
            purchaseDate: true,
            totalAmount: true,
            paidAmount: true,
            dueAmount: true,
            paymentStatus: true,
          },
        },
        payments: {
          take: 10,
          orderBy: { paymentDate: 'desc' },
        },
        _count: {
          select: {
            purchases: true,
            batches: true,
            payments: true,
          },
        },
      },
    })

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: supplier,
    })
  } catch (error) {
    return handleError(error)
  }
}

// PUT /api/suppliers/:id - Update supplier
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const validatedData = updateSupplierSchema.parse(body)

    const existingSupplier = await db.supplier.findUnique({
      where: { id: params.id },
    })

    if (!existingSupplier) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Check phone uniqueness if updating
    if (validatedData.phone && validatedData.phone !== existingSupplier.phone) {
      const phoneExists = await db.supplier.findFirst({
        where: { phone: validatedData.phone },
      })
      if (phoneExists) {
        return NextResponse.json(
          { success: false, error: 'Phone number already exists' },
          { status: 400 }
        )
      }
    }

    const supplier = await db.supplier.update({
      where: { id: params.id },
      data: validatedData,
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        module: 'SUPPLIER',
        description: `Updated supplier: ${supplier.name}`,
      },
    })

    return NextResponse.json({
      success: true,
      data: supplier,
      message: 'Supplier updated successfully',
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

// DELETE /api/suppliers/:id - Delete supplier
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const supplier = await db.supplier.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            purchases: true,
          },
        },
      },
    })

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Check if supplier has purchases
    if (supplier._count.purchases > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete supplier with existing purchases. Consider deactivating instead.' 
        },
        { status: 400 }
      )
    }

    await db.supplier.delete({
      where: { id: params.id },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        module: 'SUPPLIER',
        description: `Deleted supplier: ${supplier.name}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Supplier deleted successfully',
    })
  } catch (error) {
    return handleError(error)
  }
}
