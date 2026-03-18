"use client"

import { useState, useEffect } from "react"
import { withdrawalStore, type WithdrawalRequest } from "@/lib/db"
import { CheckCircle2, XCircle, Clock, Search, RefreshCw, Banknote } from "lucide-react"

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [filter, setFilter] = useState<"all" | "pending" | "paid" | "rejected">("pending")
  const [search, setSearch] = useState("")
  const [adminNote, setAdminNote] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<string>("")

  const load = () => setWithdrawals(withdrawalStore.getAll().reverse())
  useEffect(() => { load() }, [])

  const handlePaid = async (id: string) => {
    setLoading(id)
    await new Promise((r) => setTimeout(r, 500))
    withdrawalStore.markPaid(id, adminNote[id] || "Payment processed by admin")
    load()
    setLoading("")
  }

  const handleReject = async (id: string) => {
    setLoading(id)
    await new Promise((r) => setTimeout(r, 500))
    withdrawalStore.reject(id, adminNote[id] || "Rejected by admin")
    load()
    setLoading("")
  }

  const filtered = withdrawals.filter((w) => {
    if (filter !== "all" && w.status !== filter) return false
    if (search && !w.userName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const pendingCount = withdrawals.filter((w) => w.status === "pending").length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Withdrawal Requests</h2>
          {pendingCount > 0 && (
            <p className="text-sm text-accent font-medium mt-0.5">{pendingCount} pending payment</p>
          )}
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-xl px-3 py-2">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full bg-secondary border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "pending", "paid", "rejected"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary border border-border text-muted-foreground"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
          No withdrawal requests found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => (
            <div key={w.id} className={`bg-card border rounded-2xl p-5 transition-all ${w.status === "pending" ? "border-accent/40" : "border-border"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-foreground">{w.userName}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      w.status === "paid" ? "bg-primary/20 text-primary" :
                      w.status === "pending" ? "bg-accent/20 text-accent" :
                      "bg-destructive/20 text-destructive"
                    }`}>
                      {w.status === "paid" ? <><CheckCircle2 className="w-3 h-3 inline mr-1" />Paid</> :
                       w.status === "pending" ? <><Clock className="w-3 h-3 inline mr-1" />Pending</> :
                       <><XCircle className="w-3 h-3 inline mr-1" />Rejected</>}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">{w.userEmail}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-accent">₹{w.amount.toLocaleString("en-IN")}</div>
                  <div className="text-xs text-muted-foreground">{new Date(w.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>

              <div className="bg-secondary rounded-xl px-4 py-3 mb-4 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Method</div>
                  <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5 text-primary" />
                    {w.method === "upi" ? "UPI" : "Bank Transfer"}
                  </div>
                </div>
                {w.method === "upi" ? (
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">UPI ID</div>
                    <div className="text-sm font-mono text-foreground">{w.upiId}</div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Bank</div>
                      <div className="text-sm text-foreground">{w.bankName}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Account No.</div>
                      <div className="text-sm font-mono text-foreground">{w.accountNumber}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">IFSC</div>
                      <div className="text-sm font-mono text-foreground">{w.ifscCode}</div>
                    </div>
                  </>
                )}
              </div>

              {w.adminNote && (
                <div className="text-xs text-muted-foreground mb-3 bg-secondary/50 rounded-xl px-3 py-2">
                  Admin note: {w.adminNote}
                </div>
              )}

              {w.status === "pending" && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={adminNote[w.id] || ""}
                    onChange={(e) => setAdminNote((prev) => ({ ...prev, [w.id]: e.target.value }))}
                    placeholder="Add admin note (optional)"
                    className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePaid(w.id)}
                      disabled={loading === w.id}
                      className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {loading === w.id ? "Processing..." : "Mark Paid"}
                    </button>
                    <button
                      onClick={() => handleReject(w.id)}
                      disabled={loading === w.id}
                      className="flex items-center gap-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
