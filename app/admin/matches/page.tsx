"use client"

import { useState, useEffect } from "react"
import { matchStore, playerStore, contestStore, type Match } from "@/lib/db"
import { Plus, Trash2, Edit2, Save, X, Trophy } from "lucide-react"

const SPORTS = ["cricket", "football", "basketball", "kabaddi"] as const
const STATUSES = ["upcoming", "live", "completed"] as const

const defaultForm = {
  sport: "cricket" as Match["sport"],
  title: "",
  teamA: "",
  teamB: "",
  teamAShort: "",
  teamBShort: "",
  teamALogo: "",
  teamBLogo: "",
  startTime: "",
  status: "upcoming" as Match["status"],
  series: "",
  venue: "",
}

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  const load = () => setMatches(matchStore.getAll().reverse())
  useEffect(() => { load() }, [])

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.teamA || !form.teamB || !form.startTime) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 300))
    if (editId) {
      matchStore.update(editId, form)
    } else {
      matchStore.create(form)
    }
    load()
    setShowForm(false)
    setEditId(null)
    setForm(defaultForm)
    setSaving(false)
  }

  const handleEdit = (m: Match) => {
    setEditId(m.id)
    setForm({
      sport: m.sport,
      title: m.title,
      teamA: m.teamA,
      teamB: m.teamB,
      teamAShort: m.teamAShort,
      teamBShort: m.teamBShort,
      teamALogo: m.teamALogo,
      teamBLogo: m.teamBLogo,
      startTime: m.startTime.slice(0, 16),
      status: m.status,
      series: m.series,
      venue: m.venue,
    })
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (!confirm("Delete this match and all its contests/players?")) return
    matchStore.delete(id)
    playerStore.deleteByMatch(id)
    contestStore.getByMatch(id).forEach((c) => contestStore.delete(c.id))
    load()
  }

  const inputClass = "w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
  const labelClass = "block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide"

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Manage Matches</h2>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(defaultForm) }}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Match
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-foreground">{editId ? "Edit Match" : "Create New Match"}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Sport</label>
              <select value={form.sport} onChange={(e) => set("sport", e.target.value)} className={inputClass}>
                {SPORTS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputClass}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Match Title</label>
              <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="India vs Australia" className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Team A Name</label>
              <input value={form.teamA} onChange={(e) => set("teamA", e.target.value)} placeholder="India" className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Team A Short</label>
              <input value={form.teamAShort} onChange={(e) => set("teamAShort", e.target.value)} placeholder="IND" className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Team A Logo (emoji)</label>
              <input value={form.teamALogo} onChange={(e) => set("teamALogo", e.target.value)} placeholder="🇮🇳" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Team B Name</label>
              <input value={form.teamB} onChange={(e) => set("teamB", e.target.value)} placeholder="Australia" className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Team B Short</label>
              <input value={form.teamBShort} onChange={(e) => set("teamBShort", e.target.value)} placeholder="AUS" className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Team B Logo (emoji)</label>
              <input value={form.teamBLogo} onChange={(e) => set("teamBLogo", e.target.value)} placeholder="🇦🇺" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Start Time</label>
              <input type="datetime-local" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Series / Tournament</label>
              <input value={form.series} onChange={(e) => set("series", e.target.value)} placeholder="ICC World Cup 2025" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Venue</label>
              <input value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Wankhede Stadium, Mumbai" className={inputClass} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
                <Save className="w-4 h-4" /> {saving ? "Saving..." : editId ? "Update Match" : "Create Match"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null) }} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground border border-border hover:text-foreground transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {matches.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
          No matches yet. Add your first match above.
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <div key={m.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center gap-2 text-xl flex-shrink-0">
                    <span>{m.teamALogo}</span>
                    <span className="text-xs text-muted-foreground">vs</span>
                    <span>{m.teamBLogo}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-foreground truncate">{m.title}</div>
                    <div className="text-xs text-muted-foreground">{m.series} • {new Date(m.startTime).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    m.status === "live" ? "bg-destructive/20 text-destructive" :
                    m.status === "upcoming" ? "bg-primary/20 text-primary" :
                    "bg-muted text-muted-foreground"
                  }`}>{m.status}</span>
                  <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full capitalize">{m.sport}</span>
                  <button onClick={() => handleEdit(m)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
