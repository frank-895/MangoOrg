import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { calculateUserInspectionRecommendations } from '@/lib/inspection-service'

/**
 * GET /api/inspections
 * 
 * Returns AI-powered inspection recommendations for all orchards owned by the authenticated user.
 * 
 * @requires Authentication via Supabase session
 * @returns {InspectionRecommendation[]} Array of inspection recommendations
 */
export async function GET(request: NextRequest) {
  try {
    // Create Supabase client for server-side auth
    const supabase = createServerComponentClient({ cookies })
    
    // Get the authenticated user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = session.user.id

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