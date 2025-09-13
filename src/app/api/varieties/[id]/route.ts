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

// GET /api/varieties/[id] - Get specific variety
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const variety = await prisma.variety.findUnique({
      where: { id: params.id }
    })

    if (!variety) {
      return NextResponse.json(
        { error: 'Variety not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ variety })
  } catch (error) {
    console.error('Error fetching variety:', error)
    return NextResponse.json(
      { error: 'Failed to fetch variety' },
      { status: 500 }
    )
  }
}

// PUT /api/varieties/[id] - Update variety (admin only)
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

    const variety = await prisma.variety.update({
      where: { id: params.id },
      data: {
        varietyName,
        varietySusceptability
      }
    })

    return NextResponse.json({ variety })
  } catch (error) {
    console.error('Error updating variety:', error)
    return NextResponse.json(
      { error: 'Failed to update variety' },
      { status: 500 }
    )
  }
}

// DELETE /api/varieties/[id] - Delete variety (admin only)
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
    // Check if variety is being used by any orchards
    const orchardCount = await prisma.orchard.count({
      where: { varietyId: params.id }
    })

    if (orchardCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete variety. It is used by ${orchardCount} orchard(s).` },
        { status: 400 }
      )
    }

    await prisma.variety.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Variety deleted successfully' })
  } catch (error) {
    console.error('Error deleting variety:', error)
    return NextResponse.json(
      { error: 'Failed to delete variety' },
      { status: 500 }
    )
  }
}