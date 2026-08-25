import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'
import { generateInvoiceNumber } from '@/lib/utils'
import { z } from 'zod'

const purchaseItemSchema = z.object({
  medicineId: z.string().min(1),
  batchNumber: z.string().min(1),
  expiryDate: z.string().transform((str) => new Date(str)),
  quantity: z.number().int().min(1),
  purchasePrice: z.number().min(0),
  salePrice: z.number().min(0),
  mrp: z.number().min(0),
})

const purchaseSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  invoiceNumber: z.string().optional(),
  purchaseDate: z.string().transform((str) => new Date(str)).optional(),
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required'),
  tax: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  paidAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
})

// GET /api/purchases - Get all purchases
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('search') || ''
    const supplierId = searchParams.get('supplierId')
    const paymentStatus = searchParams.get('paymentStatus')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const skip = (page - 1) * pageSize

    const where: any = {}
    
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }
    
    if (supplierId) {
      where.supplierId = supplierId
    }
    
    if (paymentStatus) {
      where.paymentStatus = paymentStatus
    }

    if (startDate || endDate) {
      where.purchaseDate = {}
      if (startDate) {
        where.purchaseDate.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.purchaseDate.lte = end
      }
    }

    const [purchases, total] = await Promise.all([
      db.purchase.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
          items: {
            include: {
              medicine: {
                select: {
                  id: true,
                  name: true,
                  genericName: true,
                  unitType: true,
                },
              },
            },
          },
          _count: {
            select: {
              items: true,
              payments: true,
            },
          },
        },
        orderBy: { purchaseDate: 'desc' },
      }),
      db.purchase.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: purchases,
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

// POST /api/purchases - Create new purchase
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const validatedData = purchaseSchema.parse(body)

    // Check if supplier exists
    const supplier = await db.supplier.findUnique({
      where: { id: validatedData.supplierId },
    })

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Generate invoice number if not provided
    const invoiceNumber = validatedData.invoiceNumber || generateInvoiceNumber('PUR')

    // Check if invoice number exists
    const existingInvoice = await db.purchase.findUnique({
      where: { invoiceNumber },
    })

    if (existingInvoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice number already exists' },
        { status: 400 }
      )
    }

    // Calculate totals
    const subtotal = validatedData.items.reduce((sum, item) => {
      return sum + (item.quantity * item.purchasePrice)
    }, 0)

    const totalAmount = subtotal + validatedData.tax - validatedData.discount
    const dueAmount = totalAmount - validatedData.paidAmount

    let paymentStatus = 'pending'
    if (validatedData.paidAmount >= totalAmount) {
      paymentStatus = 'paid'
    } else if (validatedData.paidAmount > 0) {
      paymentStatus = 'partial'
    }

    // Create purchase with items and batches in a transaction
    const purchase = await db.$transaction(async (tx) => {
      // Create purchase
      const newPurchase = await tx.purchase.create({
        data: {
          invoiceNumber,
          supplierId: validatedData.supplierId,
          purchaseDate: validatedData.purchaseDate || new Date(),
          subtotal,
          tax: validatedData.tax,
          discount: validatedData.discount,
          totalAmount,
          paidAmount: validatedData.paidAmount,
          dueAmount,
          paymentStatus,
          notes: validatedData.notes,
          userId: session.user.id,
        },
      })

      // Create purchase items and batches
      for (const item of validatedData.items) {
        // Create purchase item
        await tx.purchaseItem.create({
          data: {
            purchaseId: newPurchase.id,
            medicineId: item.medicineId,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            quantity: item.quantity,
            purchasePrice: item.purchasePrice,
            salePrice: item.salePrice,
            mrp: item.mrp,
            total: item.quantity * item.purchasePrice,
          },
        })

        // Create or update batch
        const existingBatch = await tx.medicineBatch.findFirst({
          where: {
            medicineId: item.medicineId,
            batchNumber: item.batchNumber,
          },
        })

        if (existingBatch) {
          // Update existing batch
          await tx.medicineBatch.update({
            where: { id: existingBatch.id },
            data: {
              quantity: existingBatch.quantity + item.quantity,
              purchasePrice: item.purchasePrice,
              salePrice: item.salePrice,
              mrp: item.mrp,
              expiryDate: item.expiryDate,
            },
          })
        } else {
          // Create new batch
          await tx.medicineBatch.create({
            data: {
              medicineId: item.medicineId,
              batchNumber: item.batchNumber,
              expiryDate: item.expiryDate,
              quantity: item.quantity,
              purchasePrice: item.purchasePrice,
              salePrice: item.salePrice,
              mrp: item.mrp,
              supplierId: validatedData.supplierId,
            },
          })
        }
      }

      // Update supplier totals
      await tx.supplier.update({
        where: { id: validatedData.supplierId },
        data: {
          totalPurchase: { increment: totalAmount },
          totalPaid: { increment: validatedData.paidAmount },
          dueAmount: { increment: dueAmount },
        },
      })

      // Create payment record if paid amount > 0
      if (validatedData.paidAmount > 0) {
        await tx.payment.create({
          data: {
            paymentDate: validatedData.purchaseDate || new Date(),
            amount: validatedData.paidAmount,
            paymentMethod: 'cash',
            paymentType: 'supplier',
            supplierId: validatedData.supplierId,
            purchaseId: newPurchase.id,
            userId: session.user.id,
          },
        })
      }

      return newPurchase
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        module: 'PURCHASE',
        description: `Created purchase: ${purchase.invoiceNumber}`,
      },
    })

    // Fetch complete purchase with relations
    const completePurchase = await db.purchase.findUnique({
      where: { id: purchase.id },
      include: {
        supplier: true,
        items: {
          include: {
            medicine: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: completePurchase,
      message: 'Purchase created successfully',
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
