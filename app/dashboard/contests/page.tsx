"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { matchStore, contestStore, type Match } from "@/lib/db"
import { Clock, ChevronRight } from "lucide-react"

function countdown(t: string) {
  const diff = new Date(t).getTime() - Date.now()
  if (diff <= 0) return "Starting..."
  const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function ContestsPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [sport, setSport] = useState("all")

  useEffect(() => {
    setMatches(matchStore.getAll().filter((m) => m.status !== "completed"))
  }, [])

  const sports = ["all", "cricket", "football", "kabaddi"]
  const filtered = sport === "all" ? matches : matches.filter((m) => m.sport === sport)

  return (
    <div className="px-4 py-4">
      <h2 className="text-xl font-bold text-foreground mb-4">All Matches</h2>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {sports.map((s) => (
          <button key={s} onClick={() => setSport(s)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize ${sport === s ? "bg-primary text-primary-foreground" : "bg-secondary border border-border text-muted-foreground"}`}>
            {s}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No matches available.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => {
            const contests = contestStore.getByMatch(m.id)
            const totalPrize = contests.reduce((s, c) => s + c.totalPrize, 0)
            return (
              <Link key={m.id} href={`/dashboard/match/${m.id}`} className="block bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-colors contest-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground uppercase">{m.sport}</span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span className="font-mono font-bold text-foreground">{countdown(m.startTime)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{m.teamALogo}</span>
                    <span className="font-bold text-foreground">{m.teamAShort}</span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">VS</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{m.teamBShort}</span>
                    <span className="text-2xl">{m.teamBLogo}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div>
                    <span className="text-xs text-muted-foreground">{contests.length} Contests • </span>
                    <span className="text-xs font-bold prize-text">
                      {totalPrize >= 100000 ? `₹${(totalPrize / 100000).toFixed(0)}L` : `₹${totalPrize.toLocaleString()}`} Prize Pool
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-primary" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
