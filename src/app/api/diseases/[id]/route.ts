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

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    // Get current disease to check for image changes
    const currentDisease = await prisma.disease.findUnique({
      where: { id: params.id }
    })

    if (!currentDisease) {
      return NextResponse.json(
        { error: 'Disease not found' },
        { status: 404 }
      )
    }

    // Handle image replacement
    let oldImageUrl: string | null = null
    if (currentDisease.imageLink && currentDisease.imageLink !== imageLink) {
      oldImageUrl = currentDisease.imageLink
    }

    // Update disease
    const updatedDisease = await prisma.disease.update({
      where: { id: params.id },
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

    // Delete old image if it was replaced
    if (oldImageUrl) {
      try {
        await deleteImage(oldImageUrl)
        console.log('✅ Deleted old image:', oldImageUrl)
      } catch (error) {
        console.error('❌ Error deleting old image:', error)
        // Don't fail the update if image deletion fails
      }
    }

    return NextResponse.json(updatedDisease)
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

    // Get disease to check for associated image
    const disease = await prisma.disease.findUnique({
      where: { id: params.id }
    })

    if (!disease) {
      return NextResponse.json(
        { error: 'Disease not found' },
        { status: 404 }
      )
    }

    // Delete associated image if it exists
    if (disease.imageLink) {
      try {
        await deleteImage(disease.imageLink)
        console.log('✅ Deleted disease image:', disease.imageLink)
      } catch (error) {
        console.error('❌ Error deleting disease image:', error)
        // Don't fail the deletion if image deletion fails
      }
    }

    // Delete disease
    await prisma.disease.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting disease:', error)
    return NextResponse.json(
      { error: 'Failed to delete disease' },
      { status: 500 }
    )
  }
}
