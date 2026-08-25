import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'

// GET /api/reports/inventory - Get detailed inventory report
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
          },
          orderBy: { expiryDate: 'asc' },
        },
      },
    })

    let totalInventoryValue = 0
    let totalStockQuantity = 0
    let lowStockCount = 0
    let outOfStockCount = 0
    let expiredCount = 0
    let expiringSoonCount = 0

    const inventoryDetails = medicines.map((medicine) => {
      const totalStock = medicine.batches.reduce((sum, batch) => sum + batch.quantity, 0)
      const inventoryValue = medicine.batches.reduce((sum, batch) => {
        return sum + (batch.quantity * parseFloat(batch.purchasePrice.toString()))
      }, 0)

      totalStockQuantity += totalStock
      totalInventoryValue += inventoryValue

      const hasExpired = medicine.batches.some((b) => b.expiryDate < today)
      const hasExpiringSoon = medicine.batches.some((b) => {
        const daysUntilExpiry = Math.ceil((b.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry > 0 && daysUntilExpiry <= 90
      })

      if (totalStock === 0) outOfStockCount++
      else if (totalStock <= medicine.reorderLevel) lowStockCount++
      
      if (hasExpired) expiredCount++
      if (hasExpiringSoon) expiringSoonCount++

      return {
        medicine: {
          id: medicine.id,
          name: medicine.name,
          genericName: medicine.genericName,
          category: medicine.category,
          unitType: medicine.unitType,
          reorderLevel: medicine.reorderLevel,
        },
        totalStock,
        inventoryValue,
        batches: medicine.batches.map((batch) => ({
          batchNumber: batch.batchNumber,
          quantity: batch.quantity,
          expiryDate: batch.expiryDate,
          purchasePrice: parseFloat(batch.purchasePrice.toString()),
          salePrice: parseFloat(batch.salePrice.toString()),
          mrp: parseFloat(batch.mrp.toString()),
          isExpired: batch.expiryDate < today,
          daysUntilExpiry: Math.ceil((batch.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
        })),
        status: {
          isLowStock: totalStock > 0 && totalStock <= medicine.reorderLevel,
          isOutOfStock: totalStock === 0,
          hasExpiredBatches: hasExpired,
          hasExpiringSoonBatches: hasExpiringSoon,
        },
      }
    })

    // Category-wise summary
    const categoryStats: Record<string, { count: number; value: number; quantity: number }> = {}

    inventoryDetails.forEach((item) => {
      const category = item.medicine.category
      if (!categoryStats[category]) {
        categoryStats[category] = { count: 0, value: 0, quantity: 0 }
      }
      categoryStats[category].count++
      categoryStats[category].value += item.inventoryValue
      categoryStats[category].quantity += item.totalStock
    })

    const byCategory = Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      ...stats,
    })).sort((a, b) => b.value - a.value)

    // Stock movement analysis (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [recentPurchases, recentSales] = await Promise.all([
      db.purchaseItem.aggregate({
        where: {
          purchase: {
            purchaseDate: { gte: thirtyDaysAgo },
          },
        },
        _sum: { quantity: true },
      }),
      db.saleItem.aggregate({
        where: {
          sale: {
            saleDate: { gte: thirtyDaysAgo },
          },
        },
        _sum: { quantity: true },
      }),
    ])

    const stockMovement = {
      itemsReceived: recentPurchases._sum.quantity || 0,
      itemsSold: recentSales._sum.quantity || 0,
      netChange: (recentPurchases._sum.quantity || 0) - (recentSales._sum.quantity || 0),
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalMedicines: medicines.length,
          totalInventoryValue,
          totalStockQuantity,
          lowStockCount,
          outOfStockCount,
          expiredCount,
          expiringSoonCount,
        },
        byCategory,
        stockMovement,
        inventory: inventoryDetails,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
