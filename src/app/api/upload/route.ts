import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdmin } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `diseases/${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('disease-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading file:', error)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('disease-images')
      .getPublicUrl(fileName)

    return NextResponse.json({ 
      url: publicUrl,
      fileName: fileName 
    })
  } catch (error) {
    console.error('Error handling file upload:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
