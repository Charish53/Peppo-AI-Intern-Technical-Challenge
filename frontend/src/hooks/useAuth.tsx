import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { authService, type AuthUser } from '../lib/authService'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null }>
  signOut: () => Promise<{ error: string | null }>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  updateProfile: (updates: { full_name?: string; avatar_url?: string }) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Error checking user session:', error)
        // Set loading to false even if there's an error
        setLoading(false)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Listen for auth state changes
    try {
      const { data: { subscription } } = authService.onAuthStateChange((user) => {
        setUser(user)
        setLoading(false)
      })

      return () => subscription.unsubscribe()
    } catch (error) {
      console.error('Error setting up auth state listener:', error)
      setLoading(false)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { user, error } = await authService.signIn(email, password)
    if (!error && user) {
      setUser(user)
    }
    return { error }
  }



  const signUp = async (email: string, password: string, fullName?: string) => {
    const { user, error } = await authService.signUp(email, password, fullName)
    if (!error && user) {
      setUser(user)
    }
    return { error }
  }

  const signOut = async () => {
    const { error } = await authService.signOut()
    if (!error) {
      setUser(null)
    }
    return { error }
  }

  const resetPassword = async (email: string) => {
    return await authService.resetPassword(email)
  }

  const updateProfile = async (updates: { full_name?: string; avatar_url?: string }) => {
    if (!user) {
      return { error: 'No user logged in' }
    }
    
    const { error } = await authService.updateProfile(user.id, updates)
    if (!error) {
      setUser({ ...user, ...updates })
    }
    return { error }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 