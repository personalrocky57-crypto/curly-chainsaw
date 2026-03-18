"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import {
  LayoutDashboard, Trophy, Users, ArrowDownCircle, ArrowUpCircle,
  Menu, X, LogOut, Shield, Zap, UserCircle, Settings
} from "lucide-react"

const NAV = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/matches", icon: Trophy, label: "Matches" },
  { href: "/admin/players", icon: UserCircle, label: "Players" },
  { href: "/admin/contests", icon: Zap, label: "Contests" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/deposits", icon: ArrowDownCircle, label: "Deposits" },
  { href: "/admin/withdrawals", icon: ArrowUpCircle, label: "Withdrawals" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
]

function AdminInner({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) router.replace("/auth")
    if (!isLoading && user && user.role !== "admin") router.replace("/dashboard")
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border">
        <div className="p-5 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">FantasyPro</div>
            <div className="text-[10px] text-muted-foreground">Admin Panel</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = href === "/admin" ? pathname === href : pathname.startsWith(href)
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />{label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <button onClick={() => { logout(); router.replace("/auth") }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-card border-r border-border flex flex-col z-10">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-sm font-bold text-foreground">Admin Panel</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <nav className="flex-1 p-3 space-y-0.5">
              {NAV.map(({ href, icon: Icon, label }) => {
                const active = href === "/admin" ? pathname === href : pathname.startsWith(href)
                return (
                  <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                    <Icon className="w-4 h-4" />{label}
                  </Link>
                )
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-foreground capitalize">
                {NAV.find((n) => (n.href === "/admin" ? pathname === n.href : pathname.startsWith(n.href)))?.label || "Admin"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground hidden sm:block">Welcome, <span className="text-foreground font-semibold">{user.name}</span></div>
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">A</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminInner>{children}</AdminInner>
    </AuthProvider>
  )
}
