import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, handleError } from '@/lib/middleware'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  role: z.enum(['admin', 'staff', 'salesman']).optional(),
  isActive: z.boolean().optional(),
})

// GET /api/users/:id - Get user by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin(req)
    if (session instanceof NextResponse) return session

    const user = await db.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user,
    })
  } catch (error) {
    return handleError(error)
  }
}

// PUT /api/users/:id - Update user
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const validatedData = updateUserSchema.parse(body)

    const existingUser = await db.user.findUnique({
      where: { id: params.id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check username uniqueness if updating
    if (validatedData.username && validatedData.username !== existingUser.username) {
      const usernameExists = await db.user.findUnique({
        where: { username: validatedData.username },
      })
      if (usernameExists) {
        return NextResponse.json(
          { success: false, error: 'Username already exists' },
          { status: 400 }
        )
      }
    }

    // Check email uniqueness if updating
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email: validatedData.email },
      })
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 400 }
        )
      }
    }

    // Hash password if provided
    const updateData: any = { ...validatedData }
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 10)
    }

    const user = await db.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        module: 'USER',
        description: `Updated user: ${user.username}`,
      },
    })

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User updated successfully',
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

// DELETE /api/users/:id - Delete user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin(req)
    if (session instanceof NextResponse) return session

    // Prevent deleting self
    if (params.id === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: params.id },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    await db.user.delete({
      where: { id: params.id },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        module: 'USER',
        description: `Deleted user: ${user.username}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (error) {
    return handleError(error)
  }
}
