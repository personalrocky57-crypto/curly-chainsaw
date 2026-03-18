"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AuthProvider } from "@/lib/auth-context"
import BottomNav from "@/components/BottomNav"
import TopBar from "@/components/TopBar"

function DashboardInner({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) router.replace("/auth")
    if (!isLoading && user?.role === "admin") router.replace("/admin")
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto lg:max-w-full relative">
      <TopBar />
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardInner>{children}</DashboardInner>
    </AuthProvider>
  )
}
