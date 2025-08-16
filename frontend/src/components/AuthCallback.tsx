import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Loader2 } from 'lucide-react'

export function AuthCallback() {
  const navigate = useNavigate()
  const { handleAuthCallback } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const processAuthCallback = async () => {
      try {
        // Handle the OAuth callback
        const { user, error } = await handleAuthCallback()
        
        if (error) {
          console.error('Auth callback error:', error)
          setError('Authentication failed. Please try again.')
          setTimeout(() => navigate('/auth'), 3000)
          return
        }

        if (user) {
          console.log('🔐 [AUTH CALLBACK] Successfully authenticated:', user.email)
          // Redirect to home page after successful authentication
          navigate('/', { replace: true })
        } else {
          console.log('🔐 [AUTH CALLBACK] No user found')
          setError('Authentication failed. Please try again.')
          setTimeout(() => navigate('/auth'), 3000)
        }
      } catch (err) {
        console.error('Error in auth callback:', err)
        setError('An unexpected error occurred. Please try again.')
        setTimeout(() => navigate('/auth'), 3000)
      }
    }

    processAuthCallback()
  }, [navigate, handleAuthCallback])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {error ? 'Authentication Error' : 'Completing Sign In...'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {error ? (
            <div className="text-red-600">
              <p>{error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Redirecting to sign in page...
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Please wait while we complete your sign in...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 