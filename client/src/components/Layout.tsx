import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primary">CivicOS</h1>
            <span className="text-sm text-muted-foreground">Canadian Political Intelligence</span>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Welcome, </span>
                <span className="font-medium">{user.displayName}</span>
                <span className="text-muted-foreground ml-2">
                  (Trust: {user.trustScore} | Level: {user.civicLevel})
                </span>
              </div>
              <button
                onClick={() => logout()}
                className="px-3 py-1 text-sm border border-border rounded-md hover:bg-muted transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 CivicOS - Canadian Political Intelligence Platform</p>
            <p className="mt-1">
              Empowering citizens with real-time political data and civic engagement tools
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
} 