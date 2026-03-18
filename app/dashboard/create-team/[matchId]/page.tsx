"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { matchStore, playerStore, teamStore, type Match, type Player } from "@/lib/db"
import { ArrowLeft, ChevronRight, Info, Star, Shield, CheckCircle2 } from "lucide-react"

const ROLE_LIMITS: Record<string, { min: number; max: number }> = {
  "wicket-keeper": { min: 1, max: 4 },
  batsman:         { min: 1, max: 6 },
  "all-rounder":   { min: 1, max: 4 },
  bowler:          { min: 1, max: 6 },
  goalkeeper:      { min: 1, max: 1 },
  defender:        { min: 2, max: 5 },
  midfielder:      { min: 2, max: 5 },
  forward:         { min: 1, max: 4 },
}

const ROLE_SHORT: Record<string, string> = {
  "wicket-keeper": "WK",
  batsman: "BAT",
  "all-rounder": "AR",
  bowler: "BOWL",
  goalkeeper: "GK",
  defender: "DEF",
  midfielder: "MID",
  forward: "FWD",
}

const ROLE_COLOR: Record<string, string> = {
  "wicket-keeper": "bg-purple-500/20 text-purple-300",
  batsman:         "bg-blue-500/20 text-blue-300",
  "all-rounder":   "bg-green-500/20 text-green-300",
  bowler:          "bg-orange-500/20 text-orange-300",
  goalkeeper:      "bg-purple-500/20 text-purple-300",
  defender:        "bg-blue-500/20 text-blue-300",
  midfielder:      "bg-green-500/20 text-green-300",
  forward:         "bg-orange-500/20 text-orange-300",
}

const MAX_PLAYERS = 11
const MAX_CREDITS = 100
const MAX_PER_TEAM = 7

export default function CreateTeamPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params)
  const router = useRouter()
  const { user } = useAuth()

  const [match, setMatch] = useState<Match | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [captain, setCaptain] = useState<string>("")
  const [viceCaptain, setViceCaptain] = useState<string>("")
  const [step, setStep] = useState<"select" | "captain">("select")
  const [filterTeam, setFilterTeam] = useState<"all" | string>("all")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [teamName, setTeamName] = useState("My Team 1")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const m = matchStore.getById(matchId)
    if (!m) { router.replace("/dashboard"); return }
    setMatch(m)
    const matchPlayers = playerStore.getByMatch(matchId).filter((p) => p.isPlaying)
    setPlayers(matchPlayers)
    // Auto-set team name based on existing teams count
    const existing = user ? teamStore.getByUser(user.id).filter((t) => t.matchId === matchId) : []
    setTeamName(`My Team ${existing.length + 1}`)
  }, [matchId, router, user])

  const selectedArr = Array.from(selected)

  const creditsUsed = selectedArr.reduce((sum, pid) => {
    return sum + (players.find((p) => p.id === pid)?.credits ?? 0)
  }, 0)

  const teamACount = selectedArr.filter((pid) => players.find((p) => p.id === pid)?.team === match?.teamAShort).length
  const teamBCount = selectedArr.filter((pid) => players.find((p) => p.id === pid)?.team === match?.teamBShort).length

  const togglePlayer = (pid: string) => {
    setError("")
    if (selected.has(pid)) {
      const next = new Set(selected)
      next.delete(pid)
      setSelected(next)
      if (captain === pid) setCaptain("")
      if (viceCaptain === pid) setViceCaptain("")
      return
    }
    if (selected.size >= MAX_PLAYERS) { setError(`Maximum ${MAX_PLAYERS} players allowed.`); return }
    const p = players.find((pl) => pl.id === pid)!
    if (creditsUsed + p.credits > MAX_CREDITS) { setError("Not enough credits remaining."); return }
    const thisTeamCount = selectedArr.filter((id) => players.find((pl) => pl.id === id)?.team === p.team).length
    if (thisTeamCount >= MAX_PER_TEAM) { setError(`Max ${MAX_PER_TEAM} players from one team allowed.`); return }
    setSelected(new Set([...selected, pid]))
  }

  const handleNext = () => {
    if (selected.size !== MAX_PLAYERS) { setError(`Please select ${MAX_PLAYERS - selected.size} more player(s).`); return }
    setError("")
    setStep("captain")
  }

  const handleSave = () => {
    if (!user) return
    if (selected.size !== MAX_PLAYERS) { setError("Select exactly 11 players."); return }
    if (!captain) { setError("Please select a Captain (C)."); return }
    if (!viceCaptain) { setError("Please select a Vice-Captain (VC)."); return }
    if (!teamName.trim()) { setError("Please enter a team name."); return }

    setSaving(true)
    setError("")

    try {
      teamStore.create({
        userId: user.id,
        matchId,
        teamName: teamName.trim(),
        players: selectedArr,
        captain,
        viceCaptain,
        totalCredits: creditsUsed,
      })
      setSaved(true)
      setTimeout(() => {
        router.push(`/dashboard/match/${matchId}`)
      }, 900)
    } catch (e) {
      setError("Failed to save team. Please try again.")
      setSaving(false)
    }
  }

  const roles = [...new Set(players.map((p) => p.role))]

  const filteredPlayers = players.filter((p) => {
    if (filterTeam !== "all" && p.team !== filterTeam) return false
    if (filterRole !== "all" && p.role !== filterRole) return false
    return true
  })

  // Group by role for the select step
  const groupedByRole: Record<string, Player[]> = {}
  filteredPlayers.forEach((p) => {
    if (!groupedByRole[p.role]) groupedByRole[p.role] = []
    groupedByRole[p.role].push(p)
  })

  if (!match) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const creditsPct = Math.min((creditsUsed / MAX_CREDITS) * 100, 100)

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">

      {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-card border-b border-border">
        {/* Top row */}
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => step === "select" ? router.back() : setStep("select")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">{step === "select" ? "Back" : "Edit Players"}</span>
          </button>

          <div className="text-center">
            <div className="text-xs font-bold text-foreground">
              {step === "select" ? "Select Players" : "Pick Captain & VC"}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {match.teamAShort} vs {match.teamBShort}
            </div>
          </div>

          {step === "select" ? (
            <button
              onClick={handleNext}
              className={`flex items-center gap-1 text-sm font-bold transition-colors ${selected.size === MAX_PLAYERS ? "text-primary" : "text-muted-foreground"}`}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className={`text-sm font-bold transition-colors ${saved ? "text-primary" : saving ? "text-muted-foreground" : "text-primary hover:text-primary/80"}`}
            >
              {saved ? "Saved!" : saving ? "Saving..." : "Save Team"}
            </button>
          )}
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 divide-x divide-border border-t border-border">
          <div className="text-center py-2">
            <div className="text-[10px] text-muted-foreground">Players</div>
            <div className={`text-sm font-bold ${selected.size === MAX_PLAYERS ? "text-primary" : "text-foreground"}`}>
              {selected.size}/{MAX_PLAYERS}
            </div>
          </div>
          <div className="text-center py-2">
            <div className="text-[10px] text-muted-foreground">Credits Left</div>
            <div className={`text-sm font-bold ${creditsUsed > MAX_CREDITS * 0.9 ? "text-accent" : "text-foreground"}`}>
              {(MAX_CREDITS - creditsUsed).toFixed(1)}
            </div>
          </div>
          <div className="text-center py-2">
            <div className="text-[10px] text-muted-foreground">{match.teamAShort}</div>
            <div className="text-sm font-bold text-foreground">{teamACount}</div>
          </div>
          <div className="text-center py-2">
            <div className="text-[10px] text-muted-foreground">{match.teamBShort}</div>
            <div className="text-sm font-bold text-foreground">{teamBCount}</div>
          </div>
        </div>

        {/* Credits progress bar */}
        <div className="h-1 bg-secondary">
          <div
            className="h-full transition-all duration-300 progress-fill"
            style={{ width: `${creditsPct}%` }}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border-t border-destructive/20 px-4 py-2">
            <p className="text-destructive text-xs text-center font-medium">{error}</p>
          </div>
        )}
      </div>

      {/* ── Step 1: Select Players ── */}
      {step === "select" && (
        <div className="flex-1 flex flex-col">

          {/* Filters */}
          <div className="px-4 py-2.5 flex gap-2 overflow-x-auto border-b border-border bg-background shrink-0">
            <button
              onClick={() => { setFilterTeam("all"); setFilterRole("all") }}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${filterTeam === "all" && filterRole === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground"}`}
            >All</button>
            {[match.teamAShort, match.teamBShort].map((t) => (
              <button key={t}
                onClick={() => setFilterTeam(filterTeam === t ? "all" : t)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${filterTeam === t ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground"}`}
              >{t}</button>
            ))}
            {roles.map((r) => (
              <button key={r}
                onClick={() => setFilterRole(filterRole === r ? "all" : r)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${filterRole === r ? "bg-accent text-accent-foreground border-accent" : "bg-secondary border-border text-muted-foreground"}`}
              >{ROLE_SHORT[r] || r}</button>
            ))}
          </div>

          {/* Hint */}
          <div className="px-4 py-2 flex items-center gap-2 bg-secondary/30 border-b border-border shrink-0">
            <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              Select 11 players · Max {MAX_PER_TEAM} from one team · {MAX_CREDITS} credits total
            </p>
          </div>

          {/* Player list */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 pb-24">
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-sm">No players found.</p>
                <p className="text-muted-foreground text-xs mt-1">Ask admin to add players for this match.</p>
              </div>
            ) : (
              filteredPlayers.map((p) => {
                const isSel = selected.has(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlayer(p.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left active:scale-[0.98] ${
                      isSel
                        ? "bg-primary/10 border-primary/50 shadow-sm"
                        : "bg-card border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSel ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      }`}>
                        {p.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{p.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-muted-foreground font-medium">{p.team}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${ROLE_COLOR[p.role] || "bg-secondary text-muted-foreground"}`}>
                            {ROLE_SHORT[p.role] || p.role}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-foreground">{p.credits} Cr</div>
                      <div className="text-[10px] text-muted-foreground">{p.selectionPercentage}% picked</div>
                      {isSel && (
                        <CheckCircle2 className="w-4 h-4 text-primary ml-auto mt-0.5" />
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Bottom CTA */}
          <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 pb-6 pt-3 bg-background border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                {selected.size < MAX_PLAYERS
                  ? `Select ${MAX_PLAYERS - selected.size} more player${MAX_PLAYERS - selected.size !== 1 ? "s" : ""}`
                  : "11 players selected!"}
              </span>
              <span className="text-xs text-muted-foreground">{creditsUsed.toFixed(1)}/{MAX_CREDITS} credits</span>
            </div>
            <button
              onClick={handleNext}
              disabled={selected.size !== MAX_PLAYERS}
              className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors glow-green text-sm"
            >
              {selected.size === MAX_PLAYERS ? "Pick Captain & Vice-Captain" : `Select ${MAX_PLAYERS - selected.size} More Player${MAX_PLAYERS - selected.size !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Captain & VC + Team Name ── */}
      {step === "captain" && (
        <div className="flex-1 overflow-y-auto pb-32">

          {/* Info banner */}
          <div className="mx-4 mt-4 bg-secondary/60 border border-border rounded-xl p-3 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-accent font-bold">Captain (C)</span> earns <span className="text-accent font-bold">2x</span> points.{" "}
              <span className="text-blue-400 font-bold">Vice-Captain (VC)</span> earns <span className="text-blue-400 font-bold">1.5x</span> points.{" "}
              Choose wisely — your captain choice decides your rank!
            </div>
          </div>

          {/* Team name input */}
          <div className="mx-4 mt-4">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Team Name</label>
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              maxLength={30}
              placeholder="Enter team name"
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* C/VC selection cards */}
          <div className="mx-4 mt-4 mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Tap C or VC to assign role</p>
            <div className="space-y-2">
              {selectedArr.map((pid) => {
                const p = players.find((pl) => pl.id === pid)
                if (!p) return null
                const isCap = captain === pid
                const isVC = viceCaptain === pid

                return (
                  <div
                    key={pid}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isCap ? "bg-accent/10 border-accent/40"
                      : isVC ? "bg-blue-500/10 border-blue-500/40"
                      : "bg-card border-border"
                    }`}
                  >
                    {/* Player info */}
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 relative ${
                        isCap ? "bg-accent text-accent-foreground"
                        : isVC ? "bg-blue-500 text-white"
                        : "bg-secondary text-muted-foreground"
                      }`}>
                        {p.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                        {isCap && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-accent-foreground rounded-full text-[9px] font-black flex items-center justify-center border border-background">C</span>
                        )}
                        {isVC && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white rounded-full text-[9px] font-black flex items-center justify-center border border-background">V</span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{p.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-muted-foreground">{p.team}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${ROLE_COLOR[p.role] || "bg-secondary text-muted-foreground"}`}>
                            {ROLE_SHORT[p.role] || p.role}
                          </span>
                          {isCap && <span className="text-[10px] text-accent font-bold">2x pts</span>}
                          {isVC && <span className="text-[10px] text-blue-400 font-bold">1.5x pts</span>}
                        </div>
                      </div>
                    </div>

                    {/* C / VC buttons */}
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => {
                          if (isCap) { setCaptain(""); return }
                          if (viceCaptain === pid) setViceCaptain("")
                          setCaptain(pid)
                        }}
                        className={`w-9 h-9 rounded-full text-xs font-black border-2 transition-all active:scale-95 ${
                          isCap
                            ? "bg-accent text-accent-foreground border-accent shadow-md"
                            : "bg-secondary border-border text-muted-foreground hover:border-accent hover:text-accent"
                        }`}
                      >
                        C
                      </button>
                      <button
                        onClick={() => {
                          if (isVC) { setViceCaptain(""); return }
                          if (captain === pid) setCaptain("")
                          setViceCaptain(pid)
                        }}
                        className={`w-9 h-9 rounded-full text-xs font-black border-2 transition-all active:scale-95 ${
                          isVC
                            ? "bg-blue-500 text-white border-blue-500 shadow-md"
                            : "bg-secondary border-border text-muted-foreground hover:border-blue-500 hover:text-blue-400"
                        }`}
                      >
                        VC
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Save Button (fixed bottom for captain step) ── */}
      {step === "captain" && (
        <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 pb-6 pt-3 bg-background border-t border-border">
          {/* C/VC summary pills */}
          <div className="flex gap-2 mb-3">
            <div className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              captain ? "bg-accent/15 border-accent/40 text-accent" : "bg-secondary border-border text-muted-foreground"
            }`}>
              {captain ? `C: ${players.find(p => p.id === captain)?.name.split(" ")[0]}` : "No Captain"}
              {captain && <span className="ml-1 opacity-70">· 2x</span>}
            </div>
            <div className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              viceCaptain ? "bg-blue-500/15 border-blue-500/40 text-blue-400" : "bg-secondary border-border text-muted-foreground"
            }`}>
              {viceCaptain ? `VC: ${players.find(p => p.id === viceCaptain)?.name.split(" ")[0]}` : "No Vice-Captain"}
              {viceCaptain && <span className="ml-1 opacity-70">· 1.5x</span>}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || saved || !captain || !viceCaptain}
            className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-all glow-green text-sm flex items-center justify-center gap-2"
          >
            {saved ? (
              <><CheckCircle2 className="w-4 h-4" /> Team Saved! Redirecting...</>
            ) : saving ? (
              <><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Saving...</>
            ) : (
              <><Star className="w-4 h-4" /> Save Team</>
            )}
          </button>

          {!captain && !viceCaptain && (
            <p className="text-xs text-muted-foreground text-center mt-2">Select C and VC from the list above to continue</p>
          )}
        </div>
      )}
    </div>
  )
}
