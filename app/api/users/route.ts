import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, handleError } from '@/lib/middleware'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const userSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(['admin', 'staff', 'salesman']),
  isActive: z.boolean().optional(),
})

// GET /api/users - Get all users
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    
    const skip = (page - 1) * pageSize

    const where: any = {}
    
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (role) {
      where.role = role
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: pageSize,
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
        orderBy: { createdAt: 'desc' },
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/users - Create new user
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const validatedData = userSchema.parse(body)

    // Check if username exists
    const existingUser = await db.user.findUnique({
      where: { username: validatedData.username },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 400 }
      )
    }

    // Check if email exists
    const existingEmail = await db.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password || 'password123', 10)

    // Create user
    const user = await db.user.create({
      data: {
        ...validatedData,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        module: 'USER',
        description: `Created user: ${user.username}`,
      },
    })

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User created successfully',
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
