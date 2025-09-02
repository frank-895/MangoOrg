'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, signOut } = useAuth()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="bg-green-700 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold mr-8">🥭 MangoOrg</Link>
            <nav className="hidden lg:flex space-x-6">
              <Link href="/" className="hover:text-green-200 transition-colors">
                Home
              </Link>
              <Link href="/diseases" className="hover:text-green-200 transition-colors">
                    Diseases & Pests
              </Link>
              {user && (
                <>
                  <Link href="/dashboard" className="hover:text-green-200 transition-colors">
                    Dashboard
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center space-x-2 lg:space-x-4">
            {user ? (
              <>
                <span className="text-sm text-green-200">
                  {user.user_metadata?.display_name || user.email}
                </span>
                <button 
                  onClick={handleSignOut}
                  className="bg-red-600 hover:bg-red-700 px-3 lg:px-4 py-2 rounded-lg transition-colors text-sm lg:text-base"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login"
                  className="bg-green-600 hover:bg-green-500 px-3 lg:px-4 py-2 rounded-lg transition-colors text-sm lg:text-base"
                >
                  Login
                </Link>
                <Link 
                  href="/signup"
                  className="bg-green-800 hover:bg-green-700 px-3 lg:px-4 py-2 rounded-lg transition-colors text-sm lg:text-base"
                >
                  Sign Up
                </Link>
              </>
            )}
            {/* Mobile menu button */}
            <button 
              className="lg:hidden text-white hover:text-green-200 ml-2"
              onClick={toggleMobileMenu}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile menu dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-green-600">
            <nav className="flex flex-col space-y-4 pt-4">
              <Link 
                href="/" 
                className="hover:text-green-200 transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                    href="/diseases" 
                    className="hover:text-green-200 transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Diseases & Pests
                </Link>
              {user && (
                <>
                  <Link 
                    href="/dashboard" 
                    className="hover:text-green-200 transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>

                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
