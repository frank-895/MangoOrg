import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { isAdmin: false, error: 'No valid authorization header' }
  }

  const token = authHeader.substring(7)
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return { isAdmin: false, error: 'Invalid token' }
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id }
    })

    return { isAdmin: profile?.role === 'ADMIN', userId: user.id }
  } catch (error) {
    return { isAdmin: false, error: 'Auth check failed' }
  }
}

// GET /api/varieties - List all varieties
export async function GET() {
  try {
    const varieties = await prisma.variety.findMany({
      orderBy: { varietyName: 'asc' }
    })

    return NextResponse.json({ varieties })
  } catch (error) {
    console.error('Error fetching varieties:', error)
    return NextResponse.json(
      { error: 'Failed to fetch varieties' },
      { status: 500 }
    )
  }
}

// POST /api/varieties - Create new variety (admin only)
export async function POST(request: NextRequest) {
  const authResult = await checkAdminAuth(request)
  
  if (!authResult.isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { varietyName, varietySusceptability } = body

    // Validate required fields
    if (!varietyName || varietySusceptability === undefined) {
      return NextResponse.json(
        { error: 'varietyName and varietySusceptability are required' },
        { status: 400 }
      )
    }

    // Validate susceptability range
    if (varietySusceptability < 0 || varietySusceptability > 10) {
      return NextResponse.json(
        { error: 'varietySusceptability must be between 0 and 10' },
        { status: 400 }
      )
    }

    const variety = await prisma.variety.create({
      data: {
        varietyName,
        varietySusceptability
      }
    })

    return NextResponse.json({ variety }, { status: 201 })
  } catch (error) {
    console.error('Error creating variety:', error)
    return NextResponse.json(
      { error: 'Failed to create variety' },
      { status: 500 }
    )
  }
}