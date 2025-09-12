import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateUpcomingInspections } from '@/lib/inspection-service'

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
 * GET /api/inspections/upcoming
 * 
 * Returns simplified upcoming inspections for dashboard display.
 * This endpoint provides a lightweight version of inspection data optimized for dashboard cards.
 * 
 * @requires Authentication via Supabase session
 * @returns {UpcomingInspection[]} Array of upcoming inspections sorted by urgency
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