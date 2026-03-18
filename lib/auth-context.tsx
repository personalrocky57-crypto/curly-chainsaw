"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { authStore, userStore, seedDatabase, type User } from "./db"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => { success: boolean; error?: string }
  register: (name: string, email: string, phone: string, password: string) => { success: boolean; error?: string }
  logout: () => void
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    seedDatabase()
    const current = authStore.getCurrentUser()
    if (current) {
      const fresh = userStore.getById(current.id)
      setUser(fresh || current)
    }
    setIsLoading(false)
  }, [])

  const login = useCallback((email: string, password: string) => {
    const found = userStore.getByEmail(email.toLowerCase().trim())
    if (!found) return { success: false, error: "No account found with this email." }
    if (found.password !== password) return { success: false, error: "Incorrect password." }
    authStore.setCurrentUser(found)
    setUser(found)
    return { success: true }
  }, [])

  const register = useCallback((name: string, email: string, phone: string, password: string) => {
    const existing = userStore.getByEmail(email.toLowerCase().trim())
    if (existing) return { success: false, error: "An account with this email already exists." }
    const created = userStore.create({ name, email: email.toLowerCase().trim(), phone, password, role: "user" })
    authStore.setCurrentUser(created)
    setUser(created)
    return { success: true }
  }, [])

  const logout = useCallback(() => {
    authStore.setCurrentUser(null)
    setUser(null)
  }, [])

  const refreshUser = useCallback(() => {
    const fresh = authStore.refreshCurrentUser()
    if (fresh) setUser(fresh)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
