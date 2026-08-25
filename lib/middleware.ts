import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export async function requireAuth(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  return session
}

export async function requireAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  if (session.user.role !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'Forbidden - Admin access required' },
      { status: 403 }
    )
  }
  
  return session
}

export function handleError(error: any) {
  console.error('API Error:', error)
  
  if (error.code === 'P2002') {
    return NextResponse.json(
      { success: false, error: 'Record already exists' },
      { status: 400 }
    )
  }
  
  if (error.code === 'P2025') {
    return NextResponse.json(
      { success: false, error: 'Record not found' },
      { status: 404 }
    )
  }
  
  return NextResponse.json(
    { success: false, error: error.message || 'Internal server error' },
    { status: 500 }
  )
}
