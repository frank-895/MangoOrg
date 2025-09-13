import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

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

// GET /api/locations - List all locations
export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { locationName: 'asc' }
    })

    return NextResponse.json({ locations })
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}

// POST /api/locations - Create new location (admin only)
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
    const { locationName, hemisphere, locationSusceptability } = body

    // Validate required fields
    if (!locationName || locationSusceptability === undefined) {
      return NextResponse.json(
        { error: 'locationName and locationSusceptability are required' },
        { status: 400 }
      )
    }

    // Validate susceptability range
    if (locationSusceptability < 0 || locationSusceptability > 10) {
      return NextResponse.json(
        { error: 'locationSusceptability must be between 0 and 10' },
        { status: 400 }
      )
    }

    // Validate hemisphere
    if (hemisphere && !['NORTH', 'SOUTH'].includes(hemisphere)) {
      return NextResponse.json(
        { error: 'hemisphere must be NORTH or SOUTH' },
        { status: 400 }
      )
    }

    const location = await prisma.location.create({
      data: {
        locationName,
        hemisphere: hemisphere || 'SOUTH',
        locationSusceptability
      }
    })

    return NextResponse.json({ location }, { status: 201 })
  } catch (error) {
    console.error('Error creating location:', error)
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    )
  }
}