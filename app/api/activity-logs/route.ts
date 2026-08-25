import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleError } from '@/lib/middleware'

// GET /api/activity-logs - Get activity logs
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const userId = searchParams.get('userId')
    const module = searchParams.get('module')
    const action = searchParams.get('action')
    
    const skip = (page - 1) * pageSize

    const where: any = {}
    
    if (userId) {
      where.userId = userId
    }
    
    if (module) {
      where.module = module
    }
    
    if (action) {
      where.action = action
    }

    const [logs, total] = await Promise.all([
      db.activityLog.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          user: {
            select: {
              username: true,
              fullName: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.activityLog.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: logs,
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

// DELETE /api/activity-logs - Clear old logs (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAuth(req)
    if (session instanceof NextResponse) return session

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '90')

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const result = await db.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} activity logs older than ${days} days`,
      count: result.count,
    })
  } catch (error) {
    return handleError(error)
  }
}
