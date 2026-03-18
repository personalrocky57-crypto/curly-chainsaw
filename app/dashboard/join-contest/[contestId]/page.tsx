"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { contestStore, matchStore, teamStore, entryStore, userStore, txStore, notificationStore, type Contest, type Match } from "@/lib/db"
import { ArrowLeft, Trophy, Users, Wallet, AlertCircle, CheckCircle2 } from "lucide-react"

function formatPrize(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n}`
}

export default function JoinContestPage({ params }: { params: Promise<{ contestId: string }> }) {
  const { contestId } = use(params)
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  const [contest, setContest] = useState<Contest | null>(null)
  const [match, setMatch] = useState<Match | null>(null)
  const [myTeams, setMyTeams] = useState<ReturnType<typeof teamStore.getByUser>>([])
  const [selectedTeam, setSelectedTeam] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const c = contestStore.getById(contestId)
    if (!c) { router.replace("/dashboard"); return }
    setContest(c)
    const m = matchStore.getById(c.matchId)
    if (m) setMatch(m)
    if (user) {
      const teams = teamStore.getByUser(user.id).filter((t) => t.matchId === c.matchId)
      setMyTeams(teams)
      if (teams.length === 1) setSelectedTeam(teams[0].id)
    }
  }, [contestId, user, router])

  const handleJoin = async () => {
    if (!user || !contest) return
    setError("")

    if (!selectedTeam) { setError("Please select a team."); return }
    if (entryStore.hasEntered(user.id, contest.id)) { setError("You have already joined this contest."); return }

    const balance = user.walletBalance + user.bonusBalance
    if (contest.entryFee > 0 && balance < contest.entryFee) {
      setError("Insufficient wallet balance. Please add money.")
      return
    }

    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))

    // Deduct entry fee
    if (contest.entryFee > 0) {
      const deducted = userStore.debitWallet(user.id, contest.entryFee)
      if (!deducted) {
        // Try bonus balance
        const u = userStore.getById(user.id)!
        if (u.bonusBalance >= contest.entryFee) {
          userStore.update(user.id, { bonusBalance: u.bonusBalance - contest.entryFee })
        } else {
          setError("Failed to deduct entry fee. Please try again.")
          setLoading(false)
          return
        }
      }
      txStore.create({
        userId: user.id,
        type: "contest_fee",
        amount: contest.entryFee,
        status: "completed",
        notes: `Joined: ${contest.name}`,
      })
    }

    // Create entry
    entryStore.create({ userId: user.id, contestId: contest.id, teamId: selectedTeam })

    // Update contest filled count
    contestStore.update(contest.id, { filledTeams: contest.filledTeams + 1 })

    notificationStore.create({
      userId: user.id,
      title: "Contest Joined!",
      message: `You have successfully joined ${contest.name}. Good luck!`,
      type: "success",
    })

    refreshUser()
    setSuccess(true)
    setLoading(false)
  }

  if (!contest || !match) return null

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">You're In!</h2>
        <p className="text-muted-foreground text-center mb-8">Successfully joined <span className="text-foreground font-semibold">{contest.name}</span></p>
        <div className="w-full max-w-xs space-y-3">
          <button onClick={() => router.push(`/dashboard/match/${match.id}`)} className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors">
            Back to Match
          </button>
          <button onClick={() => router.push("/dashboard")} className="w-full bg-secondary border border-border text-foreground font-semibold py-3 rounded-xl hover:border-primary/40 transition-colors">
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  const canAfford = (user?.walletBalance ?? 0) + (user?.bonusBalance ?? 0) >= contest.entryFee

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 py-4">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="text-xl font-bold text-foreground mb-1">Join Contest</h2>
        <p className="text-muted-foreground text-sm mb-6">{match.teamAShort} vs {match.teamBShort}</p>

        {/* Contest summary */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-accent" />
            <span className="font-bold text-foreground">{contest.name}</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xs text-muted-foreground">Prize Pool</div>
              <div className="text-sm font-bold prize-text">{formatPrize(contest.totalPrize)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Entry</div>
              <div className="text-sm font-bold text-foreground">{contest.entryFee === 0 ? "FREE" : `₹${contest.entryFee}`}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">1st Prize</div>
              <div className="text-sm font-bold text-accent">{formatPrize(contest.firstPrize)}</div>
            </div>
          </div>
        </div>

        {/* Wallet balance */}
        {contest.entryFee > 0 && (
          <div className={`flex items-center justify-between p-3 rounded-xl border mb-4 ${canAfford ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20"}`}>
            <div className="flex items-center gap-2">
              <Wallet className={`w-4 h-4 ${canAfford ? "text-primary" : "text-destructive"}`} />
              <div>
                <div className="text-xs text-muted-foreground">Wallet Balance</div>
                <div className="text-sm font-bold text-foreground">₹{((user?.walletBalance ?? 0) + (user?.bonusBalance ?? 0)).toFixed(2)}</div>
              </div>
            </div>
            {!canAfford && (
              <button onClick={() => router.push("/dashboard/wallet")} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-semibold">
                Add Money
              </button>
            )}
          </div>
        )}

        {/* Team selection */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground">Select Team</h3>
            <button onClick={() => router.push(`/dashboard/create-team/${match.id}`)} className="text-xs text-primary font-semibold">
              + Create New Team
            </button>
          </div>
          {myTeams.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-xl p-6 text-center">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm mb-3">No teams created for this match yet.</p>
              <button
                onClick={() => router.push(`/dashboard/create-team/${match.id}`)}
                className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl"
              >
                Create Team
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {myTeams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeam(team.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    selectedTeam === team.id ? "bg-primary/10 border-primary/50" : "bg-card border-border hover:border-border/80"
                  }`}
                >
                  <div className="text-left">
                    <div className="text-sm font-semibold text-foreground">{team.teamName}</div>
                    <div className="text-xs text-muted-foreground">{team.players.length} players • {team.totalCredits.toFixed(1)} credits used</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedTeam === team.id ? "border-primary bg-primary" : "border-border"}`}>
                    {selectedTeam === team.id && <div className="w-2 h-2 bg-primary-foreground rounded-full" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 mb-4">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleJoin}
          disabled={loading || myTeams.length === 0}
          className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors glow-green"
        >
          {loading ? "Joining..." : contest.entryFee === 0 ? "Join Free Contest" : `Pay ₹${contest.entryFee} & Join`}
        </button>
        <p className="text-center text-xs text-muted-foreground mt-3">
          Amount will be deducted from your wallet balance
        </p>
      </div>
    </div>
  )
}
