import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'
import { isAdmin } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const disease = await prisma.disease.findUnique({
      where: { id: params.id }
    })

    if (!disease) {
      return NextResponse.json(
        { error: 'Disease not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(disease)
  } catch (error) {
    console.error('Error fetching disease:', error)
    return NextResponse.json(
      { error: 'Failed to fetch disease' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const disease = await prisma.disease.update({
      where: { id: params.id },
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

    return NextResponse.json(disease)
  } catch (error) {
    console.error('Error updating disease:', error)
    return NextResponse.json(
      { error: 'Failed to update disease' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    await prisma.disease.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Disease deleted successfully' })
  } catch (error) {
    console.error('Error deleting disease:', error)
    return NextResponse.json(
      { error: 'Failed to delete disease' },
      { status: 500 }
    )
  }
}
