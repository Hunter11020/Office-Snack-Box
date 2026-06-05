'use client'

import { createContext, useContext, ReactNode } from 'react'

export interface AuthUser {
  id: string
  email: string
  name: string | null
  role: 'USER' | 'ADMIN'
}

const AuthContext = createContext<{ user: AuthUser | null }>({ user: null })

// The user is resolved on the server (see app/layout.tsx) and passed down, so the
// client never decides its own role — it only reflects the verified session.
export function AuthProvider({
  user,
  children,
}: {
  user: AuthUser | null
  children: ReactNode
}) {
  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
export const useIsAdmin = () => useContext(AuthContext).user?.role === 'ADMIN'
