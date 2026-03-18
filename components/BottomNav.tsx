"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Trophy, Users, Wallet, User } from "lucide-react"

const TABS = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/dashboard/contests", icon: Trophy, label: "Contests" },
  { href: "/dashboard/my-teams", icon: Users, label: "My Teams" },
  { href: "/dashboard/wallet", icon: Wallet, label: "Wallet" },
  { href: "/dashboard/profile", icon: User, label: "Profile" },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom max-w-md mx-auto lg:max-w-full">
      <div className="flex items-center justify-around px-2 py-2">
        {TABS.map(({ href, icon: Icon, label }) => {
          const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors min-w-0 ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "text-primary" : ""}`} />
              <span className="text-[10px] font-medium truncate">{label}</span>
              {active && <div className="w-1 h-1 bg-primary rounded-full" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
