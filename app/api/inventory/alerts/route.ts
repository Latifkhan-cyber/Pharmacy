import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'

// GET /api/inventory/alerts - Get inventory alerts (low stock, expired, expiring soon)
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') // low_stock, expired, expiring_soon

    const today = new Date()
    const expiringSoonDate = new Date()
    expiringSoonDate.setDate(expiringSoonDate.getDate() + 90)

    // Get all medicines with their batches
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

    const alerts: any[] = []

    // Process each medicine
    for (const medicine of medicines) {
      const totalStock = medicine.batches.reduce((sum, batch) => sum + batch.quantity, 0)
      const hasExpiredBatches = medicine.batches.some((batch) => batch.expiryDate < today)
      const hasExpiringSoonBatches = medicine.batches.some(
        (batch) => batch.expiryDate >= today && batch.expiryDate <= expiringSoonDate
      )

      // Low stock alert
      if ((!type || type === 'low_stock') && totalStock <= medicine.reorderLevel) {
        alerts.push({
          type: 'low_stock',
          medicineId: medicine.id,
          medicineName: medicine.name,
          genericName: medicine.genericName,
          category: medicine.category,
          currentStock: totalStock,
          reorderLevel: medicine.reorderLevel,
          severity: totalStock === 0 ? 'critical' : totalStock < medicine.reorderLevel / 2 ? 'high' : 'medium',
        })
      }

      // Expired batches alert
      if ((!type || type === 'expired') && hasExpiredBatches) {
        const expiredBatches = medicine.batches.filter((batch) => batch.expiryDate < today)
        const expiredQuantity = expiredBatches.reduce((sum, batch) => sum + batch.quantity, 0)

        alerts.push({
          type: 'expired',
          medicineId: medicine.id,
          medicineName: medicine.name,
          genericName: medicine.genericName,
          category: medicine.category,
          expiredQuantity,
          batchesCount: expiredBatches.length,
          batches: expiredBatches.map((batch) => ({
            id: batch.id,
            batchNumber: batch.batchNumber,
            expiryDate: batch.expiryDate,
            quantity: batch.quantity,
          })),
          severity: 'high',
        })
      }

      // Expiring soon alert
      if ((!type || type === 'expiring_soon') && hasExpiringSoonBatches) {
        const expiringSoonBatches = medicine.batches.filter(
          (batch) => batch.expiryDate >= today && batch.expiryDate <= expiringSoonDate
        )
        const expiringSoonQuantity = expiringSoonBatches.reduce((sum, batch) => sum + batch.quantity, 0)

        alerts.push({
          type: 'expiring_soon',
          medicineId: medicine.id,
          medicineName: medicine.name,
          genericName: medicine.genericName,
          category: medicine.category,
          expiringSoonQuantity,
          batchesCount: expiringSoonBatches.length,
          batches: expiringSoonBatches.map((batch) => ({
            id: batch.id,
            batchNumber: batch.batchNumber,
            expiryDate: batch.expiryDate,
            quantity: batch.quantity,
            daysUntilExpiry: Math.ceil((batch.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
          })),
          severity: expiringSoonBatches.some((b) => 
            Math.ceil((b.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) <= 30
          ) ? 'high' : 'medium',
        })
      }
    }

    // Sort alerts by severity
    const sortedAlerts = alerts.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2 }
      return severityOrder[a.severity as keyof typeof severityOrder] - 
             severityOrder[b.severity as keyof typeof severityOrder]
    })

    return NextResponse.json({
      success: true,
      data: sortedAlerts,
      summary: {
        total: sortedAlerts.length,
        lowStock: sortedAlerts.filter((a) => a.type === 'low_stock').length,
        expired: sortedAlerts.filter((a) => a.type === 'expired').length,
        expiringSoon: sortedAlerts.filter((a) => a.type === 'expiring_soon').length,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
