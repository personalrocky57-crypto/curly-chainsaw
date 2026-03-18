"use client"

import { useState, useEffect } from "react"
import { contestStore, matchStore, type Contest, type Match } from "@/lib/db"
import { Plus, Trash2, Save, X, Zap } from "lucide-react"

const TYPES = ["mega", "small", "head2head", "free"] as const
const defaultForm = {
  matchId: "",
  name: "",
  entryFee: "",
  totalPrize: "",
  maxTeams: "",
  firstPrize: "",
  type: "small" as Contest["type"],
  isGuaranteed: false,
  status: "open" as Contest["status"],
}

function formatPrize(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n}`
}

export default function AdminContestsPage() {
  const [contests, setContests] = useState<Contest[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [matchFilter, setMatchFilter] = useState("all")

  const load = () => {
    setContests(contestStore.getAll().reverse())
    setMatches(matchStore.getAll())
  }
  useEffect(() => { load() }, [])

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.matchId || !form.name || !form.entryFee || !form.totalPrize || !form.maxTeams) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 300))
    contestStore.create({
      matchId: form.matchId,
      name: form.name,
      entryFee: Number(form.entryFee),
      totalPrize: Number(form.totalPrize),
      maxTeams: Number(form.maxTeams),
      firstPrize: Number(form.firstPrize),
      type: form.type,
      isGuaranteed: form.isGuaranteed,
      status: form.status,
      prizeBreakdown: [
        { rank: "1st", prize: Number(form.firstPrize) },
        { rank: "2nd", prize: Math.floor(Number(form.totalPrize) * 0.15) },
        { rank: "3rd", prize: Math.floor(Number(form.totalPrize) * 0.1) },
        { rank: "4th–10th", prize: Math.floor(Number(form.totalPrize) * 0.01) },
      ],
    })
    load()
    setShowForm(false)
    setForm(defaultForm)
    setSaving(false)
  }

  const handleDelete = (id: string) => {
    if (!confirm("Delete this contest?")) return
    contestStore.delete(id)
    load()
  }

  const filtered = matchFilter === "all" ? contests : contests.filter((c) => c.matchId === matchFilter)
  const inputClass = "w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
  const labelClass = "block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide"

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Manage Contests</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Contest
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-foreground">Create New Contest</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={labelClass}>Select Match</label>
              <select value={form.matchId} onChange={(e) => set("matchId", e.target.value)} className={inputClass} required>
                <option value="">-- Choose a match --</option>
                {matches.filter(m => m.status !== "completed").map((m) => (
                  <option key={m.id} value={m.id}>{m.title} ({m.sport})</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Contest Name</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Mega Contest" className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)} className={inputClass}>
                {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Entry Fee (₹)</label>
              <input type="number" value={form.entryFee} onChange={(e) => set("entryFee", e.target.value)} placeholder="49" min="0" className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Total Prize Pool (₹)</label>
              <input type="number" value={form.totalPrize} onChange={(e) => set("totalPrize", e.target.value)} placeholder="5000000" min="0" className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Max Teams</label>
              <input type="number" value={form.maxTeams} onChange={(e) => set("maxTeams", e.target.value)} placeholder="100000" min="2" className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>1st Prize (₹)</label>
              <input type="number" value={form.firstPrize} onChange={(e) => set("firstPrize", e.target.value)} placeholder="2000000" min="0" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputClass}>
                {(["open","full","completed","cancelled"] as const).map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 pt-5">
              <input type="checkbox" id="guaranteed" checked={form.isGuaranteed} onChange={(e) => set("isGuaranteed", e.target.checked)}
                className="w-4 h-4 accent-primary" />
              <label htmlFor="guaranteed" className="text-sm font-medium text-foreground cursor-pointer">Guaranteed Contest</label>
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
                <Save className="w-4 h-4" /> {saving ? "Creating..." : "Create Contest"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground border border-border hover:text-foreground">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter by match */}
      <div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setMatchFilter("all")}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${matchFilter === "all" ? "bg-primary text-primary-foreground" : "bg-secondary border border-border text-muted-foreground"}`}>
            All Matches
          </button>
          {matches.map((m) => (
            <button key={m.id} onClick={() => setMatchFilter(m.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${matchFilter === m.id ? "bg-primary text-primary-foreground" : "bg-secondary border border-border text-muted-foreground"}`}>
              {m.teamAShort} vs {m.teamBShort}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
          <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
          No contests found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const match = matches.find((m) => m.id === c.matchId)
            const fillPct = c.maxTeams > 0 ? Math.round((c.filledTeams / c.maxTeams) * 100) : 0
            return (
              <div key={c.id} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-foreground">{c.name}</span>
                      {c.isGuaranteed && (
                        <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-bold">G</span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        c.status === "open" ? "bg-primary/20 text-primary" :
                        c.status === "full" ? "bg-destructive/20 text-destructive" :
                        "bg-muted text-muted-foreground"
                      }`}>{c.status}</span>
                    </div>
                    {match && <div className="text-xs text-muted-foreground">{match.teamAShort} vs {match.teamBShort} • {match.sport}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-black prize-text">{formatPrize(c.totalPrize)}</div>
                      <div className="text-xs text-muted-foreground">Entry: ₹{c.entryFee}</div>
                    </div>
                    <button onClick={() => handleDelete(c.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{c.filledTeams} / {c.maxTeams} teams</span>
                  <span>{fillPct}% filled</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="progress-fill h-full rounded-full transition-all" style={{ width: `${fillPct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
