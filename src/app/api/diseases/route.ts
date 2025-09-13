import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteImage } from '@/lib/images-server'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const diseases = await prisma.disease.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(diseases)
  } catch (error) {
    console.error('Error fetching diseases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch diseases' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const adminCheck = await isAdmin(user)
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, type, severity, spreadability, shortDescription, longDescription, controlMethod, imageLink } = body

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    // Create disease
    const disease = await prisma.disease.create({
      data: {
        name,
        type,
        severity: severity || 0,
        spreadability: spreadability || 0,
        shortDescription,
        longDescription,
        controlMethod,
        imageLink
      }
    })

    return NextResponse.json(disease)
  } catch (error) {
    console.error('Error creating disease:', error)
    return NextResponse.json(
      { error: 'Failed to create disease' },
      { status: 500 }
    )
  }
}
