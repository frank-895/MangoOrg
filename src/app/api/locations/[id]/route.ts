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

// GET /api/locations/[id] - Get specific location
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const location = await prisma.location.findUnique({
      where: { id: params.id }
    })

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ location })
  } catch (error) {
    console.error('Error fetching location:', error)
    return NextResponse.json(
      { error: 'Failed to fetch location' },
      { status: 500 }
    )
  }
}

// PUT /api/locations/[id] - Update location (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const location = await prisma.location.update({
      where: { id: params.id },
      data: {
        locationName,
        hemisphere: hemisphere || 'SOUTH',
        locationSusceptability
      }
    })

    return NextResponse.json({ location })
  } catch (error) {
    console.error('Error updating location:', error)
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    )
  }
}

// DELETE /api/locations/[id] - Delete location (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await checkAdminAuth(request)
  
  if (!authResult.isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    )
  }

  try {
    // Check if location is being used by any orchards
    const orchardCount = await prisma.orchard.count({
      where: { locationId: params.id }
    })

    if (orchardCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete location. It is used by ${orchardCount} orchard(s).` },
        { status: 400 }
      )
    }

    await prisma.location.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Location deleted successfully' })
  } catch (error) {
    console.error('Error deleting location:', error)
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    )
  }
}