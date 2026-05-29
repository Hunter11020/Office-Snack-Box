'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Role = 'admin' | 'user'

interface RoleContextValue {
  role: Role
  setRole: (role: Role) => void
}

const RoleContext = createContext<RoleContextValue>({ role: 'user', setRole: () => {} })

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>('user')

  useEffect(() => {
    const stored = localStorage.getItem('snackbox-role') as Role | null
    if (stored === 'admin' || stored === 'user') setRoleState(stored)
  }, [])

  const setRole = (r: Role) => {
    setRoleState(r)
    localStorage.setItem('snackbox-role', r)
  }

  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>
}

export const useRole = () => useContext(RoleContext)
