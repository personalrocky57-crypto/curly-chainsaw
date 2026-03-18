"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Trophy, Bell, Plus, Wallet, ChevronDown } from "lucide-react"
import { notificationStore } from "@/lib/db"

export default function TopBar() {
  const { user } = useAuth()
  const [showWallet, setShowWallet] = useState(false)

  const unread = user ? notificationStore.getUnreadCount(user.id) : 0
  const total = (user?.walletBalance ?? 0) + (user?.bonusBalance ?? 0)

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Trophy className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-base font-bold text-foreground tracking-tight">FantasyPro</span>
        </Link>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          {/* Wallet pill */}
          <div className="relative">
            <button
              onClick={() => setShowWallet(!showWallet)}
              className="flex items-center gap-1.5 bg-secondary border border-border rounded-full px-3 py-1.5 hover:border-primary/50 transition-colors"
            >
              <Wallet className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-semibold text-foreground">₹{total.toFixed(0)}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
            {showWallet && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-50 p-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Deposit Balance</div>
                    <div className="text-lg font-bold text-foreground">₹{(user?.walletBalance ?? 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Bonus Balance</div>
                    <div className="text-lg font-bold text-accent">₹{(user?.bonusBalance ?? 0).toFixed(2)}</div>
                  </div>
                  <div className="border-t border-border pt-3 flex gap-2">
                    <Link
                      href="/dashboard/wallet"
                      onClick={() => setShowWallet(false)}
                      className="flex-1 bg-primary text-primary-foreground text-xs font-semibold py-2 rounded-lg text-center hover:bg-primary/90 transition-colors"
                    >
                      Add Money
                    </Link>
                    <Link
                      href="/dashboard/wallet?tab=withdraw"
                      onClick={() => setShowWallet(false)}
                      className="flex-1 bg-secondary border border-border text-foreground text-xs font-semibold py-2 rounded-lg text-center hover:border-primary/50 transition-colors"
                    >
                      Withdraw
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Add money */}
          <Link
            href="/dashboard/wallet"
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4 text-primary-foreground" />
          </Link>

          {/* Notifications */}
          <Link href="/dashboard/notifications" className="relative w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center hover:border-primary/50 transition-colors">
            <Bell className="w-4 h-4 text-foreground" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Live ticker */}
      <div className="bg-secondary/40 border-t border-border py-1 overflow-hidden">
        <div className="ticker-content whitespace-nowrap text-xs text-muted-foreground">
          <span className="text-primary font-semibold mx-2">LIVE</span>
          IND vs AUS — Mega Contest ₹50 Lakh Prize Pool&nbsp;&nbsp;|&nbsp;&nbsp;
          ENG vs SA — Head to Head ₹99 Entry&nbsp;&nbsp;|&nbsp;&nbsp;
          MCI vs RMA — UEFA Champions League Fantasy&nbsp;&nbsp;|&nbsp;&nbsp;
          New match added: PAK vs NZ — Join now!&nbsp;&nbsp;|&nbsp;&nbsp;
        </div>
      </div>
    </header>
  )
}
