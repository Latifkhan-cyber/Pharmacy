import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'
import { z } from 'zod'

const batchSchema = z.object({
  medicineId: z.string().min(1),
  batchNumber: z.string().min(1),
  expiryDate: z.string().transform((str) => new Date(str)),
  quantity: z.number().int().min(1),
  purchasePrice: z.number().min(0),
  salePrice: z.number().min(0),
  mrp: z.number().min(0),
  supplierId: z.string().optional(),
})

// GET /api/batches - Get all batches
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const medicineId = searchParams.get('medicineId')
    const expired = searchParams.get('expired') === 'true'
    const expiringSoon = searchParams.get('expiringSoon') === 'true'
    const inStock = searchParams.get('inStock') === 'true'
    
    const skip = (page - 1) * pageSize

    const where: any = {}
    
    if (medicineId) {
      where.medicineId = medicineId
    }

    if (inStock) {
      where.quantity = { gt: 0 }
    }

    const today = new Date()
    
    if (expired) {
      where.expiryDate = { lt: today }
    } else if (expiringSoon) {
      const expiringSoonDate = new Date()
      expiringSoonDate.setDate(expiringSoonDate.getDate() + 90)
      where.expiryDate = {
        gte: today,
        lte: expiringSoonDate,
      }
    }

    const [batches, total] = await Promise.all([
      db.medicineBatch.findMany({
        where,
        skip,
        take: pageSize,
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
            },
          },
        },
        orderBy: { expiryDate: 'asc' },
      }),
      db.medicineBatch.count({ where }),
    ])

    const batchesWithStatus = batches.map((batch) => ({
      ...batch,
      isExpired: batch.expiryDate < today,
      isExpiringSoon: batch.expiryDate >= today && 
                     batch.expiryDate <= new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000),
    }))

    return NextResponse.json({
      success: true,
      data: batchesWithStatus,
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

// POST /api/batches - Create new batch (Manual stock entry)
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const validatedData = batchSchema.parse(body)

    // Check if medicine exists
    const medicine = await db.medicine.findUnique({
      where: { id: validatedData.medicineId },
    })

    if (!medicine) {
      return NextResponse.json(
        { success: false, error: 'Medicine not found' },
        { status: 404 }
      )
    }

    // Check if supplier exists (if provided)
    if (validatedData.supplierId) {
      const supplier = await db.supplier.findUnique({
        where: { id: validatedData.supplierId },
      })

      if (!supplier) {
        return NextResponse.json(
          { success: false, error: 'Supplier not found' },
          { status: 404 }
        )
      }
    }

    const batch = await db.medicineBatch.create({
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
        action: 'CREATE',
        module: 'BATCH',
        description: `Added batch for ${batch.medicine.name}: ${batch.batchNumber}`,
      },
    })

    return NextResponse.json({
      success: true,
      data: batch,
      message: 'Batch created successfully',
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
