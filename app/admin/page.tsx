"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { userStore, matchStore, contestStore, depositStore, withdrawalStore, txStore } from "@/lib/db"
import { Users, Trophy, Wallet, ArrowDownCircle, ArrowUpCircle, TrendingUp, Clock, CheckCircle2, XCircle } from "lucide-react"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0, matches: 0, contests: 0,
    pendingDeposits: 0, pendingWithdrawals: 0,
    totalDeposited: 0, totalWithdrawn: 0,
  })
  const [recentDeposits, setRecentDeposits] = useState<any[]>([])
  const [recentWithdrawals, setRecentWithdrawals] = useState<any[]>([])

  useEffect(() => {
    const users = userStore.getAll().filter((u) => u.role === "user")
    const matches = matchStore.getAll()
    const contests = contestStore.getAll()
    const deposits = depositStore.getAll()
    const withdrawals = withdrawalStore.getAll()
    const txs = txStore.getAll()

    const pendingDeposits = deposits.filter((d) => d.status === "pending")
    const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending")
    const totalDeposited = txs.filter((t) => t.type === "deposit" && t.status === "completed").reduce((s, t) => s + t.amount, 0)
    const totalWithdrawn = txs.filter((t) => t.type === "withdrawal" && t.status === "completed").reduce((s, t) => s + t.amount, 0)

    setStats({
      users: users.length,
      matches: matches.length,
      contests: contests.length,
      pendingDeposits: pendingDeposits.length,
      pendingWithdrawals: pendingWithdrawals.length,
      totalDeposited,
      totalWithdrawn,
    })
    setRecentDeposits(deposits.slice(-5).reverse())
    setRecentWithdrawals(withdrawals.slice(-5).reverse())
  }, [])

  const statCards = [
    { icon: Users, label: "Total Users", value: stats.users, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20", href: "/admin/users" },
    { icon: Trophy, label: "Active Matches", value: stats.matches, color: "text-primary", bg: "bg-primary/10 border-primary/20", href: "/admin/matches" },
    { icon: ArrowDownCircle, label: "Pending Deposits", value: stats.pendingDeposits, color: "text-accent", bg: "bg-accent/10 border-accent/20", href: "/admin/deposits", urgent: stats.pendingDeposits > 0 },
    { icon: ArrowUpCircle, label: "Pending Withdrawals", value: stats.pendingWithdrawals, color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20", href: "/admin/withdrawals", urgent: stats.pendingWithdrawals > 0 },
    { icon: TrendingUp, label: "Total Deposited", value: `₹${stats.totalDeposited.toLocaleString("en-IN")}`, color: "text-primary", bg: "bg-primary/10 border-primary/20", href: "/admin/deposits" },
    { icon: Wallet, label: "Total Paid Out", value: `₹${stats.totalWithdrawn.toLocaleString("en-IN")}`, color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", href: "/admin/withdrawals" },
  ]

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(({ icon: Icon, label, value, color, bg, href, urgent }) => (
          <Link key={label} href={href}
            className={`${bg} border rounded-2xl p-4 hover:opacity-90 transition-opacity ${urgent ? "ring-2 ring-accent/50" : ""}`}>
            <div className="flex items-start justify-between mb-3">
              <Icon className={`w-5 h-5 ${color}`} />
              {urgent && <span className="w-2 h-2 bg-accent rounded-full" />}
            </div>
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent deposits */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><ArrowDownCircle className="w-4 h-4 text-primary" /> Recent Deposits</h3>
            <Link href="/admin/deposits" className="text-xs text-primary font-semibold">View All</Link>
          </div>
          {recentDeposits.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No deposits yet</p>
          ) : (
            <div className="space-y-3">
              {recentDeposits.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <div className="text-xs font-semibold text-foreground">{d.userName}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{d.utrNumber}</div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div className="text-sm font-bold text-primary">₹{d.amount}</div>
                    <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${d.status === "approved" ? "bg-primary/20 text-primary" : d.status === "pending" ? "bg-accent/20 text-accent" : "bg-destructive/20 text-destructive"}`}>
                      {d.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent withdrawals */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><ArrowUpCircle className="w-4 h-4 text-purple-400" /> Recent Withdrawals</h3>
            <Link href="/admin/withdrawals" className="text-xs text-primary font-semibold">View All</Link>
          </div>
          {recentWithdrawals.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No withdrawals yet</p>
          ) : (
            <div className="space-y-3">
              {recentWithdrawals.map((w) => (
                <div key={w.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <div className="text-xs font-semibold text-foreground">{w.userName}</div>
                    <div className="text-[10px] text-muted-foreground">{w.method === "upi" ? w.upiId : w.bankName}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold text-purple-400">₹{w.amount}</div>
                    <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${w.status === "paid" ? "bg-primary/20 text-primary" : w.status === "pending" ? "bg-accent/20 text-accent" : "bg-destructive/20 text-destructive"}`}>
                      {w.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Add Match", href: "/admin/matches?action=new", color: "bg-primary/10 border-primary/30 text-primary" },
            { label: "Add Contest", href: "/admin/contests?action=new", color: "bg-blue-400/10 border-blue-400/30 text-blue-400" },
            { label: "Approve Deposits", href: "/admin/deposits", color: "bg-accent/10 border-accent/30 text-accent" },
            { label: "Process Withdrawals", href: "/admin/withdrawals", color: "bg-purple-400/10 border-purple-400/30 text-purple-400" },
          ].map(({ label, href, color }) => (
            <Link key={label} href={href} className={`${color} border rounded-xl py-3 px-3 text-center text-xs font-bold hover:opacity-80 transition-opacity`}>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
