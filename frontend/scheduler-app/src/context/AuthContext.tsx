import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { EMAIL_KEY, TOKEN_KEY, api, setUnauthorizedHandler } from '@/lib/api'

interface AuthState {
  token: string | null
  email: string | null
  isSignedIn: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Hydrate from localStorage so a page reload does not sign the person out.
  const [token, setToken] = useState<string | null>(() => read(TOKEN_KEY))
  const [email, setEmail] = useState<string | null>(() => read(EMAIL_KEY))

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(EMAIL_KEY)
    } catch {
      // A blocked storage API must not stop the person signing out.
    }
    setToken(null)
    setEmail(null)
  }, [])

  // A 401 from any call clears the session; the route guard then sends the
  // person to /login on the next render.
  useEffect(() => {
    setUnauthorizedHandler(signOut)
  }, [signOut])

  const persist = useCallback((nextToken: string, nextEmail: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, nextToken)
      localStorage.setItem(EMAIL_KEY, nextEmail)
    } catch {
      // Still sign in for this tab even if storage is unavailable.
    }
    setToken(nextToken)
    setEmail(nextEmail)
  }, [])

  const signIn = useCallback(
    async (address: string, password: string) => {
      const result = await api.login(address, password)
      persist(result.token, result.email)
    },
    [persist],
  )

  const signUp = useCallback(
    async (address: string, password: string) => {
      const result = await api.register(address, password)
      persist(result.token, result.email)
    },
    [persist],
  )

  const value = useMemo<AuthState>(
    () => ({ token, email, isSignedIn: token !== null, signIn, signUp, signOut }),
    [token, email, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
