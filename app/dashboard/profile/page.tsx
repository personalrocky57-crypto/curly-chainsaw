"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { User, Phone, Mail, Wallet, Trophy, LogOut, ChevronRight, Shield, Bell, HelpCircle, Star } from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [confirmLogout, setConfirmLogout] = useState(false)

  const handleLogout = () => {
    logout()
    router.replace("/auth")
  }

  if (!user) return null

  const menuItems = [
    { icon: Wallet, label: "My Wallet", sub: `₹${(user.walletBalance + user.bonusBalance).toFixed(2)} balance`, href: "/dashboard/wallet" },
    { icon: Trophy, label: "My Contests", sub: "View all joined contests", href: "/dashboard/my-teams" },
    { icon: Bell, label: "Notifications", sub: "Manage alerts", href: "/dashboard/notifications" },
    { icon: Shield, label: "KYC Verification", sub: user.isVerified ? "Verified" : "Not verified – verify to withdraw", href: "/dashboard/profile" },
    { icon: HelpCircle, label: "Help & Support", sub: "FAQs, contact us", href: "/dashboard/profile" },
    { icon: Star, label: "Rate Us", sub: "Tell us about your experience", href: "/dashboard/profile" },
  ]

  return (
    <div className="px-4 py-4">
      {/* Profile card */}
      <div className="bg-gradient-to-br from-[#0d2240] to-card border border-border rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary/30">
            <span className="text-2xl font-black text-primary">{user.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <div className="text-xl font-bold text-foreground">{user.name}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Mail className="w-3 h-3" /> {user.email}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Phone className="w-3 h-3" /> +91 {user.phone}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="text-xl font-black text-primary">₹{user.walletBalance.toFixed(0)}</div>
            <div className="text-[10px] text-muted-foreground">Deposit</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-black text-accent">₹{user.bonusBalance.toFixed(0)}</div>
            <div className="text-[10px] text-muted-foreground">Bonus</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-black text-foreground">0</div>
            <div className="text-[10px] text-muted-foreground">Contests Won</div>
          </div>
        </div>
      </div>

      {/* Status badge */}
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border mb-6 ${user.isVerified ? "bg-primary/10 border-primary/20" : "bg-accent/10 border-accent/20"}`}>
        <User className={`w-4 h-4 ${user.isVerified ? "text-primary" : "text-accent"}`} />
        <span className="text-sm font-medium text-foreground">
          {user.isVerified ? "KYC Verified – full access" : "KYC Pending – verify to enable withdrawals"}
        </span>
      </div>

      {/* Menu */}
      <div className="space-y-1">
        {menuItems.map(({ icon: Icon, label, sub, href }) => (
          <Link key={label} href={href} className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-secondary/60 transition-colors">
            <div className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground">{label}</div>
              <div className="text-xs text-muted-foreground truncate">{sub}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* Logout */}
      <div className="mt-4">
        {!confirmLogout ? (
          <button onClick={() => setConfirmLogout(true)} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors font-semibold">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        ) : (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
            <p className="text-sm text-foreground font-semibold text-center mb-3">Are you sure you want to sign out?</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmLogout(false)} className="flex-1 bg-secondary border border-border text-foreground py-2.5 rounded-xl font-semibold text-sm">Cancel</button>
              <button onClick={handleLogout} className="flex-1 bg-destructive text-white py-2.5 rounded-xl font-semibold text-sm">Sign Out</button>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">FantasyPro v1.0.0 • All rights reserved</p>
    </div>
  )
}
