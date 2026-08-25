import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'
import { z } from 'zod'

const updateDistributorSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/distributors/:id - Get distributor by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const distributor = await db.distributor.findUnique({
      where: { id: params.id },
      include: {
        sales: {
          take: 10,
          orderBy: { saleDate: 'desc' },
        },
        expenses: {
          take: 10,
          orderBy: { expenseDate: 'desc' },
        },
        _count: {
          select: {
            sales: true,
            expenses: true,
          },
        },
      },
    })

    if (!distributor) {
      return NextResponse.json(
        { success: false, error: 'Distributor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: distributor,
    })
  } catch (error) {
    return handleError(error)
  }
}

// PUT /api/distributors/:id - Update distributor
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const validatedData = updateDistributorSchema.parse(body)

    const existingDistributor = await db.distributor.findUnique({
      where: { id: params.id },
    })

    if (!existingDistributor) {
      return NextResponse.json(
        { success: false, error: 'Distributor not found' },
        { status: 404 }
      )
    }

    // Check phone uniqueness if updating
    if (validatedData.phone && validatedData.phone !== existingDistributor.phone) {
      const phoneExists = await db.distributor.findUnique({
        where: { phone: validatedData.phone },
      })
      if (phoneExists) {
        return NextResponse.json(
          { success: false, error: 'Phone number already exists' },
          { status: 400 }
        )
      }
    }

    const distributor = await db.distributor.update({
      where: { id: params.id },
      data: validatedData,
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        module: 'DISTRIBUTOR',
        description: `Updated distributor: ${distributor.name}`,
      },
    })

    return NextResponse.json({
      success: true,
      data: distributor,
      message: 'Distributor updated successfully',
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

// DELETE /api/distributors/:id - Delete distributor
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const distributor = await db.distributor.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            sales: true,
            expenses: true,
          },
        },
      },
    })

    if (!distributor) {
      return NextResponse.json(
        { success: false, error: 'Distributor not found' },
        { status: 404 }
      )
    }

    // Check if distributor has transactions
    if (distributor._count.sales > 0 || distributor._count.expenses > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete distributor with existing transactions. Consider deactivating instead.' 
        },
        { status: 400 }
      )
    }

    await db.distributor.delete({
      where: { id: params.id },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        module: 'DISTRIBUTOR',
        description: `Deleted distributor: ${distributor.name}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Distributor deleted successfully',
    })
  } catch (error) {
    return handleError(error)
  }
}
