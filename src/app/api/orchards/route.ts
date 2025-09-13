import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { isAuthenticated: false, error: 'No valid authorization header' }
  }

  const token = authHeader.substring(7)
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return { isAuthenticated: false, error: 'Invalid token' }
    }

    return { isAuthenticated: true, userId: user.id }
  } catch (error) {
    return { isAuthenticated: false, error: 'Auth check failed' }
  }
}

// GET /api/orchards - List user's orchards
export async function GET(request: NextRequest) {
  const authResult = await checkAuth(request)
  
  if (!authResult.isAuthenticated) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    const orchards = await prisma.orchard.findMany({
      where: { userId: authResult.userId },
      include: {
        variety: true,
        location: true
      },
      orderBy: { orchardName: 'asc' }
    })

    return NextResponse.json({ orchards })
  } catch (error) {
    console.error('Error fetching orchards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orchards' },
      { status: 500 }
    )
  }
}

// POST /api/orchards - Create new orchard (authenticated users)
export async function POST(request: NextRequest) {
  const authResult = await checkAuth(request)
  
  if (!authResult.isAuthenticated) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { orchardName, noTreesRow, noTreesColumn, area, varietyId, locationId } = body

    // Validate required fields
    if (!orchardName || !noTreesRow || !noTreesColumn || !area || !varietyId || !locationId) {
      return NextResponse.json(
        { error: 'orchardName, noTreesRow, noTreesColumn, area, varietyId, and locationId are required' },
        { status: 400 }
      )
    }

    // Validate numeric fields
    if (noTreesRow < 1 || noTreesColumn < 1) {
      return NextResponse.json(
        { error: 'noTreesRow and noTreesColumn must be at least 1' },
        { status: 400 }
      )
    }

    if (area <= 0) {
      return NextResponse.json(
        { error: 'area must be greater than 0' },
        { status: 400 }
      )
    }

    // Verify variety and location exist
    const [variety, location] = await Promise.all([
      prisma.variety.findUnique({ where: { id: varietyId } }),
      prisma.location.findUnique({ where: { id: locationId } })
    ])

    if (!variety) {
      return NextResponse.json(
        { error: 'Invalid variety selected' },
        { status: 400 }
      )
    }

    if (!location) {
      return NextResponse.json(
        { error: 'Invalid location selected' },
        { status: 400 }
      )
    }

    const userId = authResult.userId
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      )
    }

    const orchard = await prisma.orchard.create({
      data: {
        orchardName,
        noTreesRow: parseInt(noTreesRow),
        noTreesColumn: parseInt(noTreesColumn),
        area: parseFloat(area),
        varietyId,
        locationId,
        userId
      },
      include: {
        variety: true,
        location: true
      }
    })

    return NextResponse.json({ orchard }, { status: 201 })
  } catch (error) {
    console.error('Error creating orchard:', error)
    return NextResponse.json(
      { error: 'Failed to create orchard' },
      { status: 500 }
    )
  }
}