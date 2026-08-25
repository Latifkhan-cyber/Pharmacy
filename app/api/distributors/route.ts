import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'
import { z } from 'zod'

const distributorSchema = z.object({
  name: z.string().min(1, 'Distributor name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  isActive: z.boolean().default(true),
})

// GET /api/distributors - Get all distributors
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')
    
    const skip = (page - 1) * pageSize

    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { area: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    const [distributors, total] = await Promise.all([
      db.distributor.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          _count: {
            select: {
              sales: true,
              expenses: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.distributor.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: distributors,
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

// POST /api/distributors - Create new distributor
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const validatedData = distributorSchema.parse(body)

    // Check if phone exists
    const existingPhone = await db.distributor.findUnique({
      where: { phone: validatedData.phone },
    })

    if (existingPhone) {
      return NextResponse.json(
        { success: false, error: 'Phone number already exists' },
        { status: 400 }
      )
    }

    const distributor = await db.distributor.create({
      data: validatedData,
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        module: 'DISTRIBUTOR',
        description: `Created distributor: ${distributor.name}`,
      },
    })

    return NextResponse.json({
      success: true,
      data: distributor,
      message: 'Distributor created successfully',
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
