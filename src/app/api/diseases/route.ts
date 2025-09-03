import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'
import { isAdmin } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const diseases = await prisma.disease.findMany({
      orderBy: {
        name: 'asc'
      }
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
        { error: 'Name and type are required fields' },
        { status: 400 }
      )
    }

    // Validate severity and spreadability ranges if provided
    if (severity !== undefined && (severity < 0 || severity > 10)) {
      return NextResponse.json(
        { error: 'Severity must be between 0 and 10' },
        { status: 400 }
      )
    }

    if (spreadability !== undefined && (spreadability < 0 || spreadability > 10)) {
      return NextResponse.json(
        { error: 'Spreadability must be between 0 and 10' },
        { status: 400 }
      )
    }

    const disease = await prisma.disease.create({
      data: {
        name,
        type,
        severity,
        spreadability,
        shortDescription,
        longDescription,
        controlMethod,
        imageLink
      }
    })

    return NextResponse.json(disease, { status: 201 })
  } catch (error) {
    console.error('Error creating disease:', error)
    return NextResponse.json(
      { error: 'Failed to create disease' },
      { status: 500 }
    )
  }
}
