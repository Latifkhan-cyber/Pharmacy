import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'
import { generateInvoiceNumber } from '@/lib/utils'
import { z } from 'zod'

const saleItemSchema = z.object({
  medicineId: z.string().min(1),
  batchNumber: z.string().nullable().optional(),
  quantity: z.number().int().min(1),
  salePrice: z.number().min(0),
  mrp: z.number().min(0).optional().default(0),
  discount: z.number().min(0).default(0),
  total: z.number().optional(),
})

const saleSchema = z.object({
  customerId: z.string().nullable().optional().transform(v => (v && v.trim() !== '' ? v : null)),
  invoiceNumber: z.string().optional(),
  saleDate: z.union([z.string(), z.date()]).transform((str) => new Date(str)).optional(),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().optional(),
  tax: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  totalAmount: z.number().optional(),
  paidAmount: z.number().min(0).default(0),
  dueAmount: z.number().optional(),
  paymentStatus: z.string().optional(),
  paymentMethod: z.enum(['cash', 'card', 'online', 'credit']).default('cash'),
  notes: z.string().nullable().optional(),
})

// GET /api/sales - Get all sales
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('search') || ''
    const customerId = searchParams.get('customerId')
    const paymentStatus = searchParams.get('paymentStatus')
    const paymentMethod = searchParams.get('paymentMethod')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const skip = (page - 1) * pageSize

    const where: any = {}
    
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search, mode: 'insensitive' } } },
      ]
    }
    
    if (customerId) {
      where.customerId = customerId
    }
    
    if (paymentStatus) {
      where.paymentStatus = paymentStatus
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod
    }

    if (startDate || endDate) {
      where.saleDate = {}
      if (startDate) {
        where.saleDate.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.saleDate.lte = end
      }
    }

    const [sales, total] = await Promise.all([
      db.sale.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          customer: {
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
        orderBy: { saleDate: 'desc' },
      }),
      db.sale.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: sales,
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

// POST /api/sales - Create new sale (POS)
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const validatedData = saleSchema.parse(body)

    // Check if customer exists (if provided)
    if (validatedData.customerId) {
      const customer = await db.customer.findUnique({
        where: { id: validatedData.customerId },
      })

      if (!customer) {
        return NextResponse.json(
          { success: false, error: 'Customer not found' },
          { status: 404 }
        )
      }
    }

    // Generate invoice number if not provided
    const invoiceNumber = validatedData.invoiceNumber || generateInvoiceNumber('INV')

    // Check if invoice number exists
    const existingInvoice = await db.sale.findUnique({
      where: { invoiceNumber },
    })

    if (existingInvoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice number already exists' },
        { status: 400 }
      )
    }

    // Validate stock availability for each item
    for (const item of validatedData.items) {
      const medicine = await db.medicine.findUnique({
        where: { id: item.medicineId },
        include: {
          batches: {
            where: {
              quantity: { gt: 0 },
              expiryDate: { gte: new Date() },
            },
            orderBy: { expiryDate: 'asc' },
          },
        },
      })

      if (!medicine) {
        return NextResponse.json(
          { success: false, error: `Medicine not found: ${item.medicineId}` },
          { status: 404 }
        )
      }

      const totalStock = medicine.batches.reduce((sum, batch) => sum + batch.quantity, 0)
      
      if (totalStock < item.quantity) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Insufficient stock for ${medicine.name}. Available: ${totalStock}, Required: ${item.quantity}` 
          },
          { status: 400 }
        )
      }
    }

    // Calculate totals
    const subtotal = validatedData.items.reduce((sum, item) => {
      return sum + ((item.salePrice * item.quantity) - item.discount)
    }, 0)

    const totalAmount = subtotal + validatedData.tax - validatedData.discount
    const dueAmount = totalAmount - validatedData.paidAmount

    let paymentStatus = 'paid'
    if (dueAmount > 0) {
      paymentStatus = validatedData.paidAmount > 0 ? 'partial' : 'pending'
    }

    // Create sale with items and update stock in a transaction
    const sale = await db.$transaction(async (tx) => {
      // Create sale
      const newSale = await tx.sale.create({
        data: {
          invoiceNumber,
          customerId: validatedData.customerId,
          saleDate: validatedData.saleDate || new Date(),
          subtotal,
          tax: validatedData.tax,
          discount: validatedData.discount,
          totalAmount,
          paidAmount: validatedData.paidAmount,
          dueAmount,
          paymentStatus,
          paymentMethod: validatedData.paymentMethod,
          notes: validatedData.notes,
          userId: session.user.id,
        },
      })

      // Create sale items and update stock
      for (const item of validatedData.items) {
        const itemTotal = (item.salePrice * item.quantity) - item.discount

        // Create sale item
        await tx.saleItem.create({
          data: {
            saleId: newSale.id,
            medicineId: item.medicineId,
            batchNumber: item.batchNumber,
            quantity: item.quantity,
            salePrice: item.salePrice,
            mrp: item.mrp,
            discount: item.discount,
            total: itemTotal,
          },
        })

        // Update stock (FIFO - First In First Out)
        let remainingQuantity = item.quantity
        
        const batches = await tx.medicineBatch.findMany({
          where: {
            medicineId: item.medicineId,
            quantity: { gt: 0 },
            expiryDate: { gte: new Date() },
          },
          orderBy: { expiryDate: 'asc' },
        })

        for (const batch of batches) {
          if (remainingQuantity <= 0) break

          const deductQuantity = Math.min(batch.quantity, remainingQuantity)
          
          await tx.medicineBatch.update({
            where: { id: batch.id },
            data: {
              quantity: batch.quantity - deductQuantity,
            },
          })

          remainingQuantity -= deductQuantity
        }
      }

      // Update customer totals if customer provided
      if (validatedData.customerId) {
        await tx.customer.update({
          where: { id: validatedData.customerId },
          data: {
            totalSales: { increment: totalAmount },
            totalPaid: { increment: validatedData.paidAmount },
            dueAmount: { increment: dueAmount },
          },
        })
      }

      // Create payment record if paid amount > 0
      if (validatedData.paidAmount > 0) {
        await tx.payment.create({
          data: {
            paymentDate: validatedData.saleDate || new Date(),
            amount: validatedData.paidAmount,
            paymentMethod: validatedData.paymentMethod,
            paymentType: 'customer',
            customerId: validatedData.customerId,
            saleId: newSale.id,
            userId: session.user.id,
          },
        })
      }

      return newSale
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        module: 'SALE',
        description: `Created sale: ${sale.invoiceNumber}`,
      },
    })

    // Fetch complete sale with relations
    const completeSale = await db.sale.findUnique({
      where: { id: sale.id },
      include: {
        customer: true,
        items: {
          include: {
            medicine: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: completeSale,
      message: 'Sale created successfully',
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
