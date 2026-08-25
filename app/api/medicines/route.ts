import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'
import { z } from 'zod'

const medicineSchema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  genericName: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  manufacturer: z.string().optional(),
  description: z.string().optional(),
  unitType: z.string().min(1, 'Unit type is required'),
  reorderLevel: z.number().int().min(0).default(10),
  barcode: z.string().optional(),
  isActive: z.boolean().default(true),
})

// GET /api/medicines - Get all medicines
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const lowStock = searchParams.get('lowStock') === 'true'
    const includeStock = searchParams.get('includeStock') === 'true'
    
    const skip = (page - 1) * pageSize

    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { genericName: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (category) {
      where.category = category
    }

    const [medicines, total] = await Promise.all([
      db.medicine.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          batches: {
            orderBy: { expiryDate: 'asc' },
          },
          _count: {
            select: {
              batches: true,
              saleItems: true,
              purchaseItems: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.medicine.count({ where }),
    ])

    // Calculate total stock for each medicine
    const medicinesWithStock = medicines.map((medicine) => {
      const totalStock = (medicine.batches || []).reduce((sum, batch) => sum + batch.quantity, 0)
      
      return {
        ...medicine,
        totalStock,
        isLowStock: totalStock <= medicine.reorderLevel,
      }
    })

    // Filter low stock if requested
    const filteredMedicines = lowStock
      ? medicinesWithStock.filter((m) => m.isLowStock)
      : medicinesWithStock

    return NextResponse.json({
      success: true,
      data: filteredMedicines,
      pagination: {
        page,
        pageSize,
        total: lowStock ? filteredMedicines.length : total,
        totalPages: Math.ceil((lowStock ? filteredMedicines.length : total) / pageSize),
      },
    })
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/medicines - Create new medicine
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const validatedData = medicineSchema.parse(body)

    // Check if medicine with same name exists
    const existingMedicine = await db.medicine.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: 'insensitive',
        },
      },
    })

    if (existingMedicine) {
      return NextResponse.json(
        { success: false, error: 'Medicine with this name already exists' },
        { status: 400 }
      )
    }

    // Check if barcode exists
    if (validatedData.barcode) {
      const existingBarcode = await db.medicine.findUnique({
        where: { barcode: validatedData.barcode },
      })

      if (existingBarcode) {
        return NextResponse.json(
          { success: false, error: 'Barcode already exists' },
          { status: 400 }
        )
      }
    }

    const medicine = await db.medicine.create({
      data: validatedData,
      include: {
        _count: {
          select: {
            batches: true,
          },
        },
      },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        module: 'MEDICINE',
        description: `Created medicine: ${medicine.name}`,
      },
    })

    return NextResponse.json({
      success: true,
      data: medicine,
      message: 'Medicine created successfully',
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
