import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { ThemeProvider } from './contexts/ThemeContext'
import { Toaster } from 'sonner'
import { AuthForm } from './components/AuthForm'

import Header from './components/Header'
import Footer from './components/Footer'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import { ApiKeyManager } from './components/ApiKeyManager'
import SettingsPage from './components/SettingsPage'

import Pricing from './components/Pricing'
import PaymentSuccess from './components/PaymentSuccess'
import AdminDashboard from './components/AdminDashboard'
import VideoGeneration from './pages/VideoGeneration'
import './App.css'
import React, { useState, useEffect } from 'react'

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-destructive mb-4">Something went wrong</h1>
            <p className="text-muted-foreground mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return <>{children}</>
}

// Main app layout
function AppLayout() {
  const { user, signOut } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Add a small delay to ensure everything is loaded
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/video-generation" element={
            <ProtectedRoute>
              <VideoGeneration />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/api-keys" element={
            <ProtectedRoute>
              <ApiKeyManager />
            </ProtectedRoute>
          } />
          <Route path="/auth" element={
            user ? <Navigate to="/" replace /> : <AuthForm />
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <AppLayout />
            <Toaster position="top-right" />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
