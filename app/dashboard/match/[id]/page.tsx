"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { matchStore, contestStore, entryStore, teamStore, type Match, type Contest } from "@/lib/db"
import { ArrowLeft, Trophy, Users, Shield, ChevronRight, Lock, CheckCircle2, Info } from "lucide-react"

function formatPrize(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n}`
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  mega: { label: "MEGA", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  small: { label: "SMALL", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  head2head: { label: "H2H", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  free: { label: "FREE", color: "bg-primary/20 text-primary border-primary/30" },
}

export default function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [match, setMatch] = useState<Match | null>(null)
  const [contests, setContests] = useState<Contest[]>([])
  const [filter, setFilter] = useState<"all" | "mega" | "small" | "head2head" | "free">("all")
  const [myTeams, setMyTeams] = useState<ReturnType<typeof teamStore.getByUser>>([])
  const [prizeModal, setPrizeModal] = useState<Contest | null>(null)

  useEffect(() => {
    const m = matchStore.getById(id)
    if (!m) { router.replace("/dashboard"); return }
    setMatch(m)
    setContests(contestStore.getByMatch(id))
    if (user) setMyTeams(teamStore.getByUser(user.id).filter((t) => t.matchId === id))
  }, [id, user, router])

  if (!match) return null

  const filtered = filter === "all" ? contests : contests.filter((c) => c.type === filter)

  return (
    <div>
      {/* Match header */}
      <div className="bg-gradient-to-b from-[#0d1e2e] to-background px-4 pt-4 pb-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">{match.sport} • {match.series}</span>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">UPCOMING</span>
        </div>

        <div className="flex items-center justify-around py-4">
          <div className="flex flex-col items-center gap-2">
            <span className="text-5xl">{match.teamALogo}</span>
            <span className="text-lg font-bold text-foreground">{match.teamA}</span>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-muted-foreground">VS</div>
            <div className="text-xs text-muted-foreground mt-1">{match.venue}</div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-5xl">{match.teamBLogo}</span>
            <span className="text-lg font-bold text-foreground">{match.teamB}</span>
          </div>
        </div>

        {/* Create team CTA */}
        <Link
          href={`/dashboard/create-team/${match.id}`}
          className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 mt-2 hover:bg-primary/20 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              {myTeams.length === 0 ? "Create Your Team" : `${myTeams.length} Team${myTeams.length > 1 ? "s" : ""} Created`}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-primary" />
        </Link>
      </div>

      {/* Contest filter tabs */}
      <div className="px-4 py-3 sticky top-0 bg-background z-10 border-b border-border">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["all", "mega", "small", "head2head", "free"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "head2head" ? "H2H" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Prize modal */}
      {prizeModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end" onClick={() => setPrizeModal(null)}>
          <div className="w-full bg-card border-t border-border rounded-t-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-foreground text-lg mb-1">{prizeModal.name}</h3>
            <p className="text-muted-foreground text-sm mb-4">Total Prize: {formatPrize(prizeModal.totalPrize)}</p>
            <div className="space-y-2">
              {prizeModal.prizeBreakdown.map((b) => (
                <div key={b.rank} className="flex justify-between py-2 border-b border-border last:border-0">
                  <span className="text-foreground text-sm font-medium">{b.rank}</span>
                  <span className="text-accent font-bold text-sm">{formatPrize(b.prize)}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setPrizeModal(null)} className="w-full mt-4 bg-secondary border border-border text-foreground py-3 rounded-xl font-semibold">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Contest cards */}
      <div className="px-4 py-4 space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No contests found.</div>
        ) : (
          filtered.map((contest) => {
            const entered = user ? entryStore.hasEntered(user.id, contest.id) : false
            const fillPct = Math.min((contest.filledTeams / contest.maxTeams) * 100, 100)
            const typeInfo = TYPE_LABELS[contest.type]

            return (
              <div key={contest.id} className="bg-card border border-border rounded-2xl overflow-hidden contest-card">
                {/* Header */}
                <div className="px-4 pt-4 pb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-accent" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-foreground font-bold text-sm">{contest.name}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        {contest.isGuaranteed && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                            GUARANTEED
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xl font-black prize-text">{formatPrize(contest.totalPrize)}</span>
                        <button onClick={() => setPrizeModal(contest)}>
                          <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">1st Prize</div>
                    <div className="text-sm font-bold text-accent">{formatPrize(contest.firstPrize)}</div>
                  </div>
                </div>

                {/* Progress */}
                <div className="px-4 pb-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>{contest.filledTeams.toLocaleString()} teams joined</span>
                    <span>{contest.maxTeams.toLocaleString()} max</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full progress-fill rounded-full transition-all" style={{ width: `${fillPct}%` }} />
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-secondary/40 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Shield className="w-3.5 h-3.5" />
                      <span>{contest.type === "free" ? "Free" : `₹${contest.entryFee}`}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      <span>{contest.maxTeams >= 2 ? contest.maxTeams.toLocaleString() : "2"} spots</span>
                    </div>
                  </div>
                  {entered ? (
                    <div className="flex items-center gap-1 text-primary text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Joined
                    </div>
                  ) : (
                    <Link
                      href={`/dashboard/join-contest/${contest.id}`}
                      className={`text-xs font-bold px-4 py-2 rounded-xl transition-colors ${
                        contest.status === "full"
                          ? "bg-secondary text-muted-foreground cursor-not-allowed"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {contest.status === "full" ? <><Lock className="w-3 h-3 inline mr-1" />Full</> : `Join ${contest.type === "free" ? "Free" : `₹${contest.entryFee}`}`}
                    </Link>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
