'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminCheckLoading, setAdminCheckLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      checkAdminStatus()
    }
  }, [user, loading, router])

  const checkAdminStatus = async () => {
    if (!user) {
      setAdminCheckLoading(false)
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      
      if (token) {
        const response = await fetch('/api/auth/admin', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          setIsAdmin(data.isAdmin)
        }
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
    } finally {
      setAdminCheckLoading(false)
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
              <p className="text-gray-600">
                {user.user_metadata?.display_name || user.email}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/orchards" className="bg-green-50 p-6 rounded-lg hover:bg-green-100 transition-colors">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Orchards</h3>
                <p className="text-green-600">Manage your mango orchards</p>
              </Link>
              <Link href="/cases" className="bg-blue-50 p-6 rounded-lg hover:bg-blue-100 transition-colors">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Cases</h3>
                <p className="text-blue-600">Track disease cases and records</p>
              </Link>
              <Link href="/diseases" className="bg-orange-50 p-6 rounded-lg hover:bg-orange-100 transition-colors">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">Diseases & Pests</h3>
                <p className="text-orange-600">Monitor and record findings</p>
              </Link>
            </div>

            {/* Admin Section - Only show for admin users */}
            {adminCheckLoading ? (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Admin Tools</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-100 p-6 rounded-lg animate-pulse">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-300 rounded"></div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="h-4 bg-gray-300 rounded mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-100 p-6 rounded-lg animate-pulse">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-300 rounded"></div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="h-4 bg-gray-300 rounded mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : isAdmin ? (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Admin Tools</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Link href="/admin" className="bg-purple-50 border-2 border-purple-200 p-6 rounded-lg hover:bg-purple-100 transition-colors">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-purple-800 mb-2">System Management</h3>
                        <p className="text-purple-600">Manage locations and varieties for all users</p>
                      </div>
                    </div>
                  </Link>
                  <Link href="/diseases/create" className="bg-red-50 border-2 border-red-200 p-6 rounded-lg hover:bg-red-100 transition-colors">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-red-800 mb-2">Disease Management</h3>
                        <p className="text-red-600">Add and edit disease/pest information</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            ) : null}

          </div>
        </div>
      </div>
    </div>
  )
}
