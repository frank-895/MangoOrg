import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { calculateUpcomingInspections } from '@/lib/inspection-service'

/**
 * GET /api/inspections/upcoming
 * 
 * Returns simplified upcoming inspections for dashboard display.
 * This endpoint provides a lightweight version of inspection data optimized for dashboard cards.
 * 
 * @requires Authentication via Supabase session
 * @returns {UpcomingInspection[]} Array of upcoming inspections sorted by urgency
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

    // Calculate upcoming inspections using the service
    const upcomingInspections = await calculateUpcomingInspections(userId)

    return NextResponse.json({
      success: true,
      inspections: upcomingInspections,
      count: upcomingInspections.length,
      urgent: upcomingInspections.filter(i => i.status === 'OVERDUE' || i.status === 'DUE_TODAY').length
    })

  } catch (error) {
    console.error('Error fetching upcoming inspections:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to calculate upcoming inspections',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}