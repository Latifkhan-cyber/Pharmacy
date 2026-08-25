import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, handleError } from '@/lib/middleware'
import { z } from 'zod'

const settingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  description: z.string().optional(),
})

// GET /api/settings - Get all settings
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin(req)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')

    if (key) {
      const setting = await db.setting.findUnique({
        where: { key },
      })

      if (!setting) {
        return NextResponse.json(
          { success: false, error: 'Setting not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: setting,
      })
    }

    const settings = await db.setting.findMany({
      orderBy: { key: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/settings - Create or update setting
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const validatedData = settingSchema.parse(body)

    const setting = await db.setting.upsert({
      where: { key: validatedData.key },
      update: {
        value: validatedData.value,
        description: validatedData.description,
      },
      create: validatedData,
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        module: 'SETTINGS',
        description: `Updated setting: ${setting.key}`,
      },
    })

    return NextResponse.json({
      success: true,
      data: setting,
      message: 'Setting saved successfully',
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

// PUT /api/settings - Bulk update settings
export async function PUT(req: NextRequest) {
  try {
    const session = await requireAdmin(req)
    if (session instanceof NextResponse) return session

    const body = await req.json()
    const settings = z.array(settingSchema).parse(body)

    const updatePromises = settings.map((setting) =>
      db.setting.upsert({
        where: { key: setting.key },
        update: {
          value: setting.value,
          description: setting.description,
        },
        create: setting,
      })
    )

    await Promise.all(updatePromises)

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        module: 'SETTINGS',
        description: `Updated ${settings.length} settings`,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
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
