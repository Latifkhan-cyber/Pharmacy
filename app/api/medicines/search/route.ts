import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'

// GET /api/medicines/search - Quick search for medicines (for POS/Sales)
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    const medicines = await db.medicine.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { genericName: { contains: query, mode: 'insensitive' } },
          { barcode: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      include: {
        batches: {
          where: {
            quantity: { gt: 0 },
            expiryDate: { gte: new Date() },
          },
          orderBy: { expiryDate: 'asc' },
          take: 1, // Get the batch with nearest expiry
        },
      },
    })

    const medicinesWithStock = medicines.map((medicine) => {
      const totalStock = medicine.batches.reduce((sum, batch) => sum + batch.quantity, 0)
      const batch = medicine.batches[0]

      return {
        id: medicine.id,
        name: medicine.name,
        genericName: medicine.genericName,
        category: medicine.category,
        unitType: medicine.unitType,
        barcode: medicine.barcode,
        totalStock,
        isLowStock: totalStock <= medicine.reorderLevel,
        reorderLevel: medicine.reorderLevel,
        batch: batch ? {
          id: batch.id,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          quantity: batch.quantity,
          purchasePrice: batch.purchasePrice,
          salePrice: batch.salePrice,
          mrp: batch.mrp,
        } : null,
      }
    })

    // Filter out medicines with no stock
    const availableMedicines = medicinesWithStock.filter((m) => m.totalStock > 0)

    return NextResponse.json({
      success: true,
      data: availableMedicines,
    })
  } catch (error) {
    return handleError(error)
  }
}
