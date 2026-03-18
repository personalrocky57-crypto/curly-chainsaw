"use client"

import { useState, useEffect } from "react"
import { matchStore, playerStore, type Match, type Player } from "@/lib/db"
import { Plus, Trash2, Save, X, Users } from "lucide-react"

const CRICKET_ROLES = ["batsman", "bowler", "all-rounder", "wicket-keeper"] as const
const FOOTBALL_ROLES = ["goalkeeper", "defender", "midfielder", "forward"] as const

const ROLE_SHORT: Record<string, string> = {
  batsman: "BAT", bowler: "BOWL", "all-rounder": "AR", "wicket-keeper": "WK",
  goalkeeper: "GK", defender: "DEF", midfielder: "MID", forward: "FWD",
}

const defaultPlayer = {
  name: "", team: "", role: "batsman" as Player["role"],
  credits: "8", selectionPercentage: "30", points: "0", isPlaying: true,
}

export default function AdminPlayersPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedMatch, setSelectedMatch] = useState<string>("")
  const [players, setPlayers] = useState<Player[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultPlayer)
  const [saving, setSaving] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)

  useEffect(() => {
    const m = matchStore.getAll()
    setMatches(m)
    if (m.length > 0 && !selectedMatch) setSelectedMatch(m[0].id)
  }, [])

  useEffect(() => {
    if (selectedMatch) setPlayers(playerStore.getByMatch(selectedMatch))
  }, [selectedMatch])

  const match = matches.find((m) => m.id === selectedMatch)
  const roles = match?.sport === "football" ? FOOTBALL_ROLES : CRICKET_ROLES

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.team || !selectedMatch) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 200))
    playerStore.create({
      matchId: selectedMatch,
      name: form.name,
      team: form.team,
      role: form.role,
      credits: Number(form.credits),
      selectionPercentage: Number(form.selectionPercentage),
      points: Number(form.points),
      isPlaying: form.isPlaying,
    })
    setPlayers(playerStore.getByMatch(selectedMatch))
    setForm({ ...defaultPlayer, team: form.team, role: form.role })
    setSaving(false)
    if (!bulkMode) setShowForm(false)
  }

  const handleDelete = (id: string) => {
    playerStore.delete(id)
    setPlayers(playerStore.getByMatch(selectedMatch))
  }

  const seedSamplePlayers = () => {
    if (!match) return
    if (!confirm(`Seed 22 sample players for ${match.title}?`)) return
    const teamA = match.teamAShort
    const teamB = match.teamBShort

    const cricketPlayersA = [
      { name: `${teamA} Player 1`, role: "wicket-keeper" as Player["role"], credits: 9.5 },
      { name: `${teamA} Player 2`, role: "batsman" as Player["role"], credits: 10 },
      { name: `${teamA} Player 3`, role: "batsman" as Player["role"], credits: 9 },
      { name: `${teamA} Player 4`, role: "batsman" as Player["role"], credits: 8.5 },
      { name: `${teamA} Player 5`, role: "batsman" as Player["role"], credits: 8 },
      { name: `${teamA} Player 6`, role: "all-rounder" as Player["role"], credits: 9 },
      { name: `${teamA} Player 7`, role: "all-rounder" as Player["role"], credits: 8.5 },
      { name: `${teamA} Player 8`, role: "bowler" as Player["role"], credits: 9 },
      { name: `${teamA} Player 9`, role: "bowler" as Player["role"], credits: 8.5 },
      { name: `${teamA} Player 10`, role: "bowler" as Player["role"], credits: 8 },
      { name: `${teamA} Player 11`, role: "bowler" as Player["role"], credits: 7.5 },
    ]
    const cricketPlayersB = cricketPlayersA.map((p, i) => ({
      ...p,
      name: p.name.replace(teamA, teamB),
    }))

    const footballPlayersA = [
      { name: `${teamA} Keeper`, role: "goalkeeper" as Player["role"], credits: 8 },
      { name: `${teamA} Def 1`, role: "defender" as Player["role"], credits: 8 },
      { name: `${teamA} Def 2`, role: "defender" as Player["role"], credits: 7.5 },
      { name: `${teamA} Def 3`, role: "defender" as Player["role"], credits: 7 },
      { name: `${teamA} Mid 1`, role: "midfielder" as Player["role"], credits: 9 },
      { name: `${teamA} Mid 2`, role: "midfielder" as Player["role"], credits: 8.5 },
      { name: `${teamA} Mid 3`, role: "midfielder" as Player["role"], credits: 8 },
      { name: `${teamA} Mid 4`, role: "midfielder" as Player["role"], credits: 7.5 },
      { name: `${teamA} Fwd 1`, role: "forward" as Player["role"], credits: 10 },
      { name: `${teamA} Fwd 2`, role: "forward" as Player["role"], credits: 9.5 },
      { name: `${teamA} Fwd 3`, role: "forward" as Player["role"], credits: 9 },
    ]
    const footballPlayersB = footballPlayersA.map((p) => ({ ...p, name: p.name.replace(teamA, teamB) }))

    const isFootball = match.sport === "football"
    const allPlayers = isFootball
      ? [...footballPlayersA, ...footballPlayersB]
      : [...cricketPlayersA, ...cricketPlayersB]

    playerStore.createBulk(
      allPlayers.map((p) => ({
        ...p,
        matchId: selectedMatch,
        team: p.name.includes(teamA) ? teamA : teamB,
        selectionPercentage: Math.floor(Math.random() * 70) + 10,
        points: 0,
        isPlaying: true,
      }))
    )
    setPlayers(playerStore.getByMatch(selectedMatch))
  }

  const inputClass = "w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
  const labelClass = "block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide"

  const teamAPlayers = players.filter((p) => match && p.team === match.teamAShort)
  const teamBPlayers = players.filter((p) => match && p.team === match.teamBShort)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-foreground">Manage Players</h2>
        <div className="flex gap-2">
          <button
            onClick={seedSamplePlayers}
            disabled={!selectedMatch}
            className="text-xs bg-secondary border border-border text-muted-foreground hover:text-foreground px-3 py-2 rounded-xl disabled:opacity-40 transition-colors"
          >
            Auto-Seed Players
          </button>
          <button
            onClick={() => { setShowForm(true); setBulkMode(false) }}
            disabled={!selectedMatch}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Player
          </button>
        </div>
      </div>

      {/* Match selector */}
      <div>
        <label className={labelClass}>Select Match</label>
        <select
          value={selectedMatch}
          onChange={(e) => setSelectedMatch(e.target.value)}
          className={inputClass}
        >
          {matches.length === 0 && <option value="">No matches yet — create one first</option>}
          {matches.map((m) => (
            <option key={m.id} value={m.id}>{m.title} ({m.sport})</option>
          ))}
        </select>
      </div>

      {/* Add player form */}
      {showForm && selectedMatch && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-foreground">{bulkMode ? "Bulk Add Players" : "Add Player"}</h3>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={bulkMode} onChange={(e) => setBulkMode(e.target.checked)} className="accent-primary" />
                Bulk mode (stay open)
              </label>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className={labelClass}>Player Name</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Player full name" className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Team</label>
              <select value={form.team} onChange={(e) => set("team", e.target.value)} className={inputClass} required>
                <option value="">Select team</option>
                {match && [match.teamAShort, match.teamBShort].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Role</label>
              <select value={form.role} onChange={(e) => set("role", e.target.value)} className={inputClass}>
                {roles.map((r) => <option key={r} value={r}>{ROLE_SHORT[r]} – {r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Credits</label>
              <input type="number" step="0.5" min="4" max="12" value={form.credits} onChange={(e) => set("credits", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Selection %</label>
              <input type="number" min="0" max="100" value={form.selectionPercentage} onChange={(e) => set("selectionPercentage", e.target.value)} className={inputClass} />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPlaying} onChange={(e) => set("isPlaying", e.target.checked)} className="w-4 h-4 accent-primary" />
                <span className="text-sm text-foreground font-medium">Playing XI</span>
              </label>
            </div>
            <div className="col-span-2 sm:col-span-3 flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-xl text-sm font-bold disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? "Adding..." : "Add Player"}
              </button>
              {!bulkMode && (
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm text-muted-foreground border border-border hover:text-foreground">Cancel</button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Player lists */}
      {match && players.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            { label: match.teamAShort, list: teamAPlayers },
            { label: match.teamBShort, list: teamBPlayers },
          ].map(({ label, list }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-4">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-secondary rounded-md flex items-center justify-center text-[10px] font-black">{label.slice(0, 2)}</span>
                {label} — {list.length} players
              </h3>
              <div className="space-y-2">
                {list.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <div>
                      <span className="text-sm font-medium text-foreground">{p.name}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${p.isPlaying ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {p.isPlaying ? "PLAYING" : "BENCH"}
                        </span>
                        <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{ROLE_SHORT[p.role]}</span>
                        <span className="text-[10px] text-muted-foreground">{p.credits} Cr</span>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : selectedMatch ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium mb-1">No players yet</p>
          <p className="text-xs">Add players manually or use Auto-Seed to quickly populate.</p>
        </div>
      ) : null}
    </div>
  )
}
