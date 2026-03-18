"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function RootPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Dynamically import db to avoid SSR issues
    import("@/lib/db").then(({ authStore, seedDatabase }) => {
      seedDatabase()
      const user = authStore.getCurrentUser()
      if (!user) {
        router.replace("/auth")
      } else if (user.role === "admin") {
        router.replace("/admin")
      } else {
        router.replace("/dashboard")
      }
      setReady(true)
    })
  }, [router])

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-[#00d563] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#8a9ab5] text-sm">Loading FantasyPro...</p>
      </div>
    </div>
  )
}
