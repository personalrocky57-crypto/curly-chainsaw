"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { matchStore, contestStore, type Match, type Contest } from "@/lib/db"
import { Clock, ChevronRight, Flame, Star, Zap } from "lucide-react"

function countdown(startTime: string) {
  const diff = new Date(startTime).getTime() - Date.now()
  if (diff <= 0) return "Starting..."
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatPrize(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n}`
}

function MatchCard({ match, contests }: { match: Match; contests: Contest[] }) {
  const [time, setTime] = useState(countdown(match.startTime))
  const totalPrize = contests.reduce((s, c) => s + c.totalPrize, 0)
  const contestCount = contests.length

  useEffect(() => {
    const t = setInterval(() => setTime(countdown(match.startTime)), 1000)
    return () => clearInterval(t)
  }, [match.startTime])

  return (
    <Link href={`/dashboard/match/${match.id}`} className="block">
      <div className="bg-card border border-border rounded-2xl overflow-hidden contest-card hover:border-primary/30">
        {/* Sport badge */}
        <div className="bg-secondary/60 px-4 pt-3 pb-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{match.sport} • {match.series}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            match.status === "live"
              ? "bg-destructive/20 text-destructive"
              : "bg-primary/10 text-primary"
          }`}>
            {match.status === "live" ? (
              <span className="flex items-center gap-1"><span className="live-dot w-1.5 h-1.5 bg-destructive rounded-full inline-block" />LIVE</span>
            ) : "UPCOMING"}
          </span>
        </div>

        <div className="px-4 py-3">
          {/* Teams */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl">{match.teamALogo}</span>
              <span className="text-sm font-bold text-foreground">{match.teamAShort}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <Clock className="w-3 h-3" />
                <span className="font-mono font-bold text-foreground">{time}</span>
              </div>
              <span className="text-xs text-muted-foreground">VS</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl">{match.teamBLogo}</span>
              <span className="text-sm font-bold text-foreground">{match.teamBShort}</span>
            </div>
          </div>

          {/* Venue */}
          <p className="text-xs text-muted-foreground text-center mb-3 truncate">{match.venue}</p>

          {/* Prize info */}
          <div className="bg-secondary/50 rounded-xl px-3 py-2 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Prize Pool</div>
              <div className="text-base font-bold prize-text">{formatPrize(totalPrize)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Contests</div>
              <div className="text-base font-bold text-foreground">{contestCount}</div>
            </div>
            <button className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors">
              Play
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function DashboardHome() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [allContests, setAllContests] = useState<Contest[]>([])
  const [tab, setTab] = useState<"cricket" | "football" | "kabaddi" | "all">("all")

  useEffect(() => {
    const m = matchStore.getAll()
    const c = contestStore.getAll()
    setMatches(m.filter((x) => x.status !== "completed"))
    setAllContests(c)
  }, [])

  const filtered = tab === "all" ? matches : matches.filter((m) => m.sport === tab)

  const sportTabs = [
    { key: "all", label: "All" },
    { key: "cricket", label: "Cricket" },
    { key: "football", label: "Football" },
    { key: "kabaddi", label: "Kabaddi" },
  ] as const

  return (
    <div className="px-4 py-4 space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#0d2a1a] to-[#0a1f30] border border-primary/20 rounded-2xl p-4 glow-green">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Welcome back,</p>
            <h2 className="text-xl font-bold text-foreground">{user?.name?.split(" ")[0]} 👋</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-medium">
                ₹{(user?.bonusBalance ?? 0).toFixed(0)} Bonus
              </span>
              <span className="text-xs text-muted-foreground">available to use</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Wallet Balance</div>
            <div className="text-2xl font-bold text-primary">₹{(user?.walletBalance ?? 0).toFixed(0)}</div>
            <Link href="/dashboard/wallet" className="text-xs text-muted-foreground hover:text-primary underline">
              Add Money
            </Link>
          </div>
        </div>
      </div>

      {/* Promo cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Flame, label: "Hot Contest", sub: "₹50L Prize", color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/20" },
          { icon: Star, label: "New Match", sub: "Just Added", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
          { icon: Zap, label: "Free Entry", sub: "Practice Now", color: "text-primary", bg: "bg-primary/10 border-primary/20" },
        ].map(({ icon: Icon, label, sub, color, bg }) => (
          <div key={label} className={`${bg} border rounded-xl p-3 text-center`}>
            <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
            <div className="text-xs font-bold text-foreground">{label}</div>
            <div className="text-[10px] text-muted-foreground">{sub}</div>
          </div>
        ))}
      </div>

      {/* Sport filter tabs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-foreground">Upcoming Matches</h3>
          <Link href="/dashboard/contests" className="text-primary text-xs font-semibold flex items-center gap-0.5">
            View All <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
          {sportTabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                tab === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <p className="text-muted-foreground">No matches available for this sport.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((m) => (
              <MatchCard key={m.id} match={m} contests={allContests.filter((c) => c.matchId === m.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
