import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'
import { z } from 'zod'

const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
})

// GET /api/users/profile - Get current user profile
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const user = await db.user.findUnique({
      where: { id: session.user.id },
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

// PUT /api/users/profile - Update current user profile
export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const validatedData = updateProfileSchema.parse(body)

    // Check email uniqueness if updating
    if (validatedData.email) {
      const existingUser = await db.user.findFirst({
        where: {
          email: validatedData.email,
          NOT: { id: session.user.id },
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Email already in use' },
          { status: 400 }
        )
      }
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: validatedData,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        updatedAt: true,
      },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        module: 'PROFILE',
        description: 'Updated profile',
      },
    })

    return NextResponse.json({
      success: true,
      data: user,
      message: 'Profile updated successfully',
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
