import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateUserInspectionRecommendations } from '@/lib/inspection-service'

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

/**
 * GET /api/inspections
 * 
 * Returns AI-powered inspection recommendations for all orchards owned by the authenticated user.
 * 
 * @requires Authentication via Supabase session
 * @returns {InspectionRecommendation[]} Array of inspection recommendations
 */
export async function GET(request: NextRequest) {
  const authResult = await checkAuth(request)
  
  if (!authResult.isAuthenticated) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    const userId = authResult.userId
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      )
    }

    // Calculate inspection recommendations using the service
    const recommendations = await calculateUserInspectionRecommendations(userId)

    return NextResponse.json({
      success: true,
      recommendations,
      count: recommendations.length
    })

  } catch (error) {
    console.error('Error fetching inspection recommendations:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to calculate inspection recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}