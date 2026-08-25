import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'

// GET /api/inventory/summary - Get inventory summary
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const today = new Date()

    // Get all medicines with batches
    const medicines = await db.medicine.findMany({
      where: {
        isActive: true,
      },
      include: {
        batches: {
          where: {
            quantity: { gt: 0 },
            expiryDate: { gte: today },
          },
        },
      },
    })

    // Calculate total inventory value
    let totalInventoryValue = 0
    let totalStockQuantity = 0
    let lowStockCount = 0
    let outOfStockCount = 0

    medicines.forEach((medicine) => {
      const totalStock = medicine.batches.reduce((sum, batch) => sum + batch.quantity, 0)
      totalStockQuantity += totalStock

      medicine.batches.forEach((batch) => {
        totalInventoryValue += batch.quantity * parseFloat(batch.purchasePrice.toString())
      })

      if (totalStock === 0) {
        outOfStockCount++
      } else if (totalStock <= medicine.reorderLevel) {
        lowStockCount++
      }
    })

    // Expired batches
    const expiredBatches = await db.medicineBatch.findMany({
      where: {
        expiryDate: { lt: today },
        quantity: { gt: 0 },
      },
      include: {
        medicine: {
          select: {
            name: true,
          },
        },
      },
    })

    const expiredValue = expiredBatches.reduce((sum, batch) => {
      return sum + (batch.quantity * parseFloat(batch.purchasePrice.toString()))
    }, 0)

    // Expiring soon batches (within 90 days)
    const expiringSoonDate = new Date()
    expiringSoonDate.setDate(expiringSoonDate.getDate() + 90)

    const expiringSoonBatches = await db.medicineBatch.findMany({
      where: {
        expiryDate: {
          gte: today,
          lte: expiringSoonDate,
        },
        quantity: { gt: 0 },
      },
      include: {
        medicine: {
          select: {
            name: true,
          },
        },
      },
    })

    const expiringSoonValue = expiringSoonBatches.reduce((sum, batch) => {
      return sum + (batch.quantity * parseFloat(batch.purchasePrice.toString()))
    }, 0)

    // Category-wise breakdown
    const categoryBreakdown = await db.medicine.findMany({
      where: {
        isActive: true,
      },
      select: {
        category: true,
        batches: {
          where: {
            quantity: { gt: 0 },
            expiryDate: { gte: today },
          },
        },
      },
    })

    const categoryStats: Record<string, { count: number; value: number; quantity: number }> = {}

    categoryBreakdown.forEach((medicine) => {
      if (!categoryStats[medicine.category]) {
        categoryStats[medicine.category] = { count: 0, value: 0, quantity: 0 }
      }

      const totalStock = medicine.batches.reduce((sum, batch) => sum + batch.quantity, 0)
      if (totalStock > 0) {
        categoryStats[medicine.category].count++
        categoryStats[medicine.category].quantity += totalStock

        medicine.batches.forEach((batch) => {
          categoryStats[medicine.category].value += 
            batch.quantity * parseFloat(batch.purchasePrice.toString())
        })
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        totalMedicines: medicines.length,
        totalInventoryValue,
        totalStockQuantity,
        lowStockCount,
        outOfStockCount,
        expiredBatches: {
          count: expiredBatches.length,
          value: expiredValue,
        },
        expiringSoonBatches: {
          count: expiringSoonBatches.length,
          value: expiringSoonValue,
        },
        categoryBreakdown: Object.entries(categoryStats).map(([category, stats]) => ({
          category,
          ...stats,
        })),
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
