"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { teamStore, entryStore, matchStore, contestStore, playerStore } from "@/lib/db"
import { Users, Trophy, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"

const ROLE_SHORT: Record<string, string> = {
  "wicket-keeper": "WK", batsman: "BAT", "all-rounder": "AR", bowler: "BOWL",
  goalkeeper: "GK", defender: "DEF", midfielder: "MID", forward: "FWD",
}

export default function MyTeamsPage() {
  const { user } = useAuth()
  const [teams, setTeams] = useState<any[]>([])
  const [entries, setEntries] = useState<any[]>([])
  const [expanded, setExpanded] = useState<string>("")
  const [tab, setTab] = useState<"teams" | "entries">("teams")

  useEffect(() => {
    if (!user) return
    const myTeams = teamStore.getByUser(user.id)
    const myEntries = entryStore.getByUser(user.id)
    setTeams(myTeams)
    setEntries(myEntries.map((e) => {
      const contest = contestStore.getById(e.contestId)
      const match = contest ? matchStore.getById(contest.matchId) : null
      const team = teamStore.getById(e.teamId)
      return { ...e, contest, match, team }
    }).reverse())
  }, [user])

  return (
    <div className="px-4 py-4">
      <h2 className="text-xl font-bold text-foreground mb-4">My Activity</h2>

      <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-6">
        {(["teams", "entries"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            {t === "teams" ? `My Teams (${teams.length})` : `Contests (${entries.length})`}
          </button>
        ))}
      </div>

      {tab === "teams" && (
        teams.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No teams created yet.</p>
            <Link href="/dashboard" className="text-primary font-semibold text-sm mt-2 inline-block">Browse Matches</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {teams.map((team) => {
              const match = matchStore.getById(team.matchId)
              const players = team.players.map((pid: string) => playerStore.getById(pid)).filter(Boolean)
              const open = expanded === team.id
              return (
                <div key={team.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <button onClick={() => setExpanded(open ? "" : team.id)} className="w-full flex items-center justify-between px-4 py-3">
                    <div className="text-left">
                      <div className="text-sm font-bold text-foreground">{team.teamName}</div>
                      <div className="text-xs text-muted-foreground">{match ? `${match.teamAShort} vs ${match.teamBShort}` : "Match"} • {players.length} players</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{team.totalCredits.toFixed(1)} Cr</span>
                      {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {open && (
                    <div className="px-4 pb-4 border-t border-border pt-3">
                      <div className="grid grid-cols-2 gap-2">
                        {players.map((p: any) => (
                          <div key={p.id} className={`flex items-center gap-2 p-2 rounded-lg ${team.captain === p.id || team.viceCaptain === p.id ? "bg-primary/10 border border-primary/20" : "bg-secondary"}`}>
                            <div className="w-7 h-7 rounded-full bg-border flex items-center justify-center text-[10px] font-bold text-foreground">
                              {p.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-foreground truncate">{p.name}</div>
                              <div className="text-[10px] text-muted-foreground">{ROLE_SHORT[p.role]}</div>
                            </div>
                            {team.captain === p.id && <span className="text-[10px] font-black text-accent">C</span>}
                            {team.viceCaptain === p.id && <span className="text-[10px] font-black text-blue-400">VC</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {tab === "entries" && (
        entries.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">You haven't joined any contests yet.</p>
            <Link href="/dashboard" className="text-primary font-semibold text-sm mt-2 inline-block">Join a Contest</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry: any) => (
              <div key={entry.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-foreground">{entry.contest?.name || "Contest"}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{entry.match ? `${entry.match.teamAShort} vs ${entry.match.teamBShort}` : ""}</div>
                  <div className="text-xs text-muted-foreground">{entry.team?.teamName || "Team"}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-accent">₹{entry.contest?.entryFee || 0}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{new Date(entry.createdAt).toLocaleDateString("en-IN")}</div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
