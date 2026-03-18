"use client"

import { useState, useEffect } from "react"
import { userStore, type User } from "@/lib/db"
import { Search, RefreshCw, Plus, Minus, Users } from "lucide-react"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState("")
  const [creditAmount, setCreditAmount] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<string>("")

  const load = () => setUsers(userStore.getAll().filter((u) => u.role === "user"))
  useEffect(() => { load() }, [])

  const handleCredit = async (id: string) => {
    const amt = Number(creditAmount[id])
    if (!amt || amt <= 0) return
    setLoading(id + "_credit")
    await new Promise((r) => setTimeout(r, 300))
    userStore.creditWallet(id, amt)
    setCreditAmount((p) => ({ ...p, [id]: "" }))
    load()
    setLoading("")
  }

  const handleDebit = async (id: string) => {
    const amt = Number(creditAmount[id])
    if (!amt || amt <= 0) return
    setLoading(id + "_debit")
    await new Promise((r) => setTimeout(r, 300))
    userStore.debitWallet(id, amt)
    setCreditAmount((p) => ({ ...p, [id]: "" }))
    load()
    setLoading("")
  }

  const filtered = users.filter((u) =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.phone.includes(search)
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Users</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{users.length} registered users</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-xl px-3 py-2">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or phone..."
          className="w-full bg-secondary border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          No users found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => (
            <div key={u.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                    <div className="text-xs text-muted-foreground">{u.phone}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Wallet Balance</div>
                  <div className="text-xl font-black text-primary">₹{u.walletBalance.toLocaleString("en-IN")}</div>
                  <div className="text-xs text-muted-foreground">Bonus: ₹{u.bonusBalance}</div>
                </div>
              </div>

              {/* Manual credit/debit */}
              <div className="flex gap-2">
                <input
                  type="number"
                  value={creditAmount[u.id] || ""}
                  onChange={(e) => setCreditAmount((p) => ({ ...p, [u.id]: e.target.value }))}
                  placeholder="Amount"
                  min="1"
                  className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
                <button
                  onClick={() => handleCredit(u.id)}
                  disabled={loading.startsWith(u.id)}
                  className="flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Credit
                </button>
                <button
                  onClick={() => handleDebit(u.id)}
                  disabled={loading.startsWith(u.id)}
                  className="flex items-center gap-1 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" /> Debit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
