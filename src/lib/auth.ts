import { User } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

export async function isAdmin(user: User | null): Promise<boolean> {
  if (!user) return false
  
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id }
    })
    
    return profile?.role === 'ADMIN'
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

export function isAuthenticated(user: User | null): boolean {
  return user !== null
}

export async function createOrUpdateProfile(userId: string, role: 'USER' | 'ADMIN' = 'USER') {
  try {
    const profile = await prisma.profile.upsert({
      where: { userId },
      update: { role },
      create: { userId, role }
    })
    return profile
  } catch (error) {
    console.error('Error creating/updating profile:', error)
    throw error
  }
}

export async function getUserProfile(userId: string) {
  try {
    return await prisma.profile.findUnique({
      where: { userId }
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}
