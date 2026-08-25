import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'
import { z } from 'zod'

const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  creditLimit: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
})

// GET /api/customers/:id - Get customer by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const customer = await db.customer.findUnique({
      where: { id: params.id },
      include: {
        sales: {
          take: 10,
          orderBy: { saleDate: 'desc' },
          select: {
            id: true,
            invoiceNumber: true,
            saleDate: true,
            totalAmount: true,
            paidAmount: true,
            dueAmount: true,
            paymentStatus: true,
            paymentMethod: true,
          },
        },
        payments: {
          take: 10,
          orderBy: { paymentDate: 'desc' },
          include: {
            sale: {
              select: {
                invoiceNumber: true,
              },
            },
          },
        },
        _count: {
          select: {
            sales: true,
            payments: true,
          },
        },
      },
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: customer,
    })
  } catch (error) {
    return handleError(error)
  }
}

// PUT /api/customers/:id - Update customer
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const validatedData = updateCustomerSchema.parse(body)

    const existingCustomer = await db.customer.findUnique({
      where: { id: params.id },
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Check phone uniqueness if updating
    if (validatedData.phone && validatedData.phone !== existingCustomer.phone) {
      const phoneExists = await db.customer.findUnique({
        where: { phone: validatedData.phone },
      })
      if (phoneExists) {
        return NextResponse.json(
          { success: false, error: 'Phone number already exists' },
          { status: 400 }
        )
      }
    }

    const customer = await db.customer.update({
      where: { id: params.id },
      data: validatedData,
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        module: 'CUSTOMER',
        description: `Updated customer: ${customer.name}`,
      },
    })

    return NextResponse.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully',
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

// DELETE /api/customers/:id - Delete customer
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const customer = await db.customer.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            sales: true,
          },
        },
      },
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Check if customer has sales
    if (customer._count.sales > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete customer with existing sales. Consider deactivating instead.' 
        },
        { status: 400 }
      )
    }

    // Check if customer has outstanding dues
    const dueAmount = parseFloat(customer.dueAmount.toString())
    if (dueAmount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete customer with outstanding dues.' 
        },
        { status: 400 }
      )
    }

    await db.customer.delete({
      where: { id: params.id },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        module: 'CUSTOMER',
        description: `Deleted customer: ${customer.name}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully',
    })
  } catch (error) {
    return handleError(error)
  }
}
