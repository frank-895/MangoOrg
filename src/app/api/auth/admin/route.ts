import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
  )
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ isAdmin: false })
    }

    const token = authHeader.substring(7)
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ isAdmin: false })
    }

    // Check if user is admin
    const adminStatus = await isAdmin(user)
    
    return NextResponse.json({ isAdmin: adminStatus })
  } catch (error) {
    console.error('Error checking admin status:', error)
    return NextResponse.json({ isAdmin: false })
  }
}
