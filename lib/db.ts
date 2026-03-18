// Fantasy Sports App - localStorage Database Layer
// All data persisted in browser localStorage

export interface User {
  id: string
  name: string
  email: string
  phone: string
  password: string
  role: "user" | "admin"
  walletBalance: number
  bonusBalance: number
  createdAt: string
  avatar?: string
  isVerified: boolean
}

export interface Match {
  id: string
  sport: "cricket" | "football" | "basketball" | "kabaddi"
  title: string
  teamA: string
  teamB: string
  teamAShort: string
  teamBShort: string
  teamALogo: string
  teamBLogo: string
  startTime: string
  status: "upcoming" | "live" | "completed"
  series: string
  venue: string
  createdAt: string
}

export interface Player {
  id: string
  matchId: string
  name: string
  team: string
  role: "batsman" | "bowler" | "all-rounder" | "wicket-keeper" | "forward" | "midfielder" | "defender" | "goalkeeper"
  credits: number
  selectionPercentage: number
  points: number
  battingOrder?: number
  isPlaying: boolean
}

export interface Contest {
  id: string
  matchId: string
  name: string
  entryFee: number
  totalPrize: number
  maxTeams: number
  filledTeams: number
  firstPrize: number
  prizeBreakdown: { rank: string; prize: number }[]
  type: "mega" | "small" | "head2head" | "free"
  isGuaranteed: boolean
  createdAt: string
  status: "open" | "full" | "completed" | "cancelled"
}

export interface UserTeam {
  id: string
  userId: string
  matchId: string
  teamName: string
  players: string[] // player IDs
  captain: string
  viceCaptain: string
  totalCredits: number
  points: number
  createdAt: string
}

export interface ContestEntry {
  id: string
  userId: string
  contestId: string
  teamId: string
  rank?: number
  prizeWon?: number
  createdAt: string
}

export interface Transaction {
  id: string
  userId: string
  type: "deposit" | "withdrawal" | "contest_fee" | "prize_won" | "bonus"
  amount: number
  status: "pending" | "approved" | "rejected" | "completed"
  utrNumber?: string
  notes?: string
  adminNote?: string
  createdAt: string
  updatedAt: string
  method?: string
}

export interface DepositRequest {
  id: string
  userId: string
  userName: string
  userEmail: string
  amount: number
  utrNumber: string
  screenshotUrl?: string
  status: "pending" | "approved" | "rejected"
  adminNote?: string
  createdAt: string
  updatedAt: string
}

export interface WithdrawalRequest {
  id: string
  userId: string
  userName: string
  userEmail: string
  amount: number
  bankName?: string
  accountNumber?: string
  ifscCode?: string
  upiId?: string
  method: "bank" | "upi"
  status: "pending" | "paid" | "rejected"
  adminNote?: string
  createdAt: string
  updatedAt: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  isRead: boolean
  createdAt: string
}

// ─── Generic Storage Helpers ──────────────────────────────────────────────────

function getStore<T>(key: string): T[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as T[]
  } catch {
    return []
  }
}

function setStore<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(data))
}

function generateId(): string {
  return crypto.randomUUID()
}

// ─── Auth Store ───────────────────────────────────────────────────────────────

export const authStore = {
  getCurrentUser: (): User | null => {
    if (typeof window === "undefined") return null
    try {
      const u = localStorage.getItem("current_user")
      return u ? (JSON.parse(u) as User) : null
    } catch {
      return null
    }
  },
  setCurrentUser: (user: User | null) => {
    if (typeof window === "undefined") return
    if (user) localStorage.setItem("current_user", JSON.stringify(user))
    else localStorage.removeItem("current_user")
  },
  refreshCurrentUser: () => {
    const cur = authStore.getCurrentUser()
    if (!cur) return null
    const fresh = userStore.getById(cur.id)
    if (fresh) authStore.setCurrentUser(fresh)
    return fresh
  },
}

// ─── User Store ───────────────────────────────────────────────────────────────

export const userStore = {
  getAll: () => getStore<User>("users"),
  getById: (id: string) => getStore<User>("users").find((u) => u.id === id),
  getByEmail: (email: string) => getStore<User>("users").find((u) => u.email === email),
  create: (data: Omit<User, "id" | "createdAt" | "walletBalance" | "bonusBalance" | "isVerified">): User => {
    const users = getStore<User>("users")
    const user: User = {
      ...data,
      id: generateId(),
      walletBalance: 0,
      bonusBalance: 50, // welcome bonus
      isVerified: false,
      createdAt: new Date().toISOString(),
    }
    setStore("users", [...users, user])
    return user
  },
  update: (id: string, updates: Partial<User>): User | null => {
    const users = getStore<User>("users")
    const idx = users.findIndex((u) => u.id === id)
    if (idx === -1) return null
    users[idx] = { ...users[idx], ...updates }
    setStore("users", users)
    return users[idx]
  },
  creditWallet: (id: string, amount: number) => {
    const user = userStore.getById(id)
    if (!user) return null
    return userStore.update(id, { walletBalance: user.walletBalance + amount })
  },
  debitWallet: (id: string, amount: number) => {
    const user = userStore.getById(id)
    if (!user || user.walletBalance < amount) return null
    return userStore.update(id, { walletBalance: user.walletBalance - amount })
  },
}

// ─── Match Store ──────────────────────────────────────────────────────────────

export const matchStore = {
  getAll: () => getStore<Match>("matches"),
  getById: (id: string) => getStore<Match>("matches").find((m) => m.id === id),
  getByStatus: (status: Match["status"]) => getStore<Match>("matches").filter((m) => m.status === status),
  create: (data: Omit<Match, "id" | "createdAt">): Match => {
    const matches = getStore<Match>("matches")
    const match: Match = { ...data, id: generateId(), createdAt: new Date().toISOString() }
    setStore("matches", [...matches, match])
    return match
  },
  update: (id: string, updates: Partial<Match>): Match | null => {
    const matches = getStore<Match>("matches")
    const idx = matches.findIndex((m) => m.id === id)
    if (idx === -1) return null
    matches[idx] = { ...matches[idx], ...updates }
    setStore("matches", matches)
    return matches[idx]
  },
  delete: (id: string) => {
    setStore("matches", getStore<Match>("matches").filter((m) => m.id !== id))
  },
}

// ─── Player Store ─────────────────────────────────────────────────────────────

export const playerStore = {
  getAll: () => getStore<Player>("players"),
  getByMatch: (matchId: string) => getStore<Player>("players").filter((p) => p.matchId === matchId),
  getById: (id: string) => getStore<Player>("players").find((p) => p.id === id),
  create: (data: Omit<Player, "id">): Player => {
    const players = getStore<Player>("players")
    const player: Player = { ...data, id: generateId() }
    setStore("players", [...players, player])
    return player
  },
  createBulk: (dataList: Omit<Player, "id">[]): Player[] => {
    const players = getStore<Player>("players")
    const newPlayers = dataList.map((d) => ({ ...d, id: generateId() }))
    setStore("players", [...players, ...newPlayers])
    return newPlayers
  },
  update: (id: string, updates: Partial<Player>): Player | null => {
    const players = getStore<Player>("players")
    const idx = players.findIndex((p) => p.id === id)
    if (idx === -1) return null
    players[idx] = { ...players[idx], ...updates }
    setStore("players", players)
    return players[idx]
  },
  delete: (id: string) => {
    setStore("players", getStore<Player>("players").filter((p) => p.id !== id))
  },
  deleteByMatch: (matchId: string) => {
    setStore("players", getStore<Player>("players").filter((p) => p.matchId !== matchId))
  },
}

// ─── Contest Store ────────────────────────────────────────────────────────────

export const contestStore = {
  getAll: () => getStore<Contest>("contests"),
  getById: (id: string) => getStore<Contest>("contests").find((c) => c.id === id),
  getByMatch: (matchId: string) => getStore<Contest>("contests").filter((c) => c.matchId === matchId),
  create: (data: Omit<Contest, "id" | "createdAt" | "filledTeams">): Contest => {
    const contests = getStore<Contest>("contests")
    const contest: Contest = { ...data, id: generateId(), filledTeams: 0, createdAt: new Date().toISOString() }
    setStore("contests", [...contests, contest])
    return contest
  },
  update: (id: string, updates: Partial<Contest>): Contest | null => {
    const contests = getStore<Contest>("contests")
    const idx = contests.findIndex((c) => c.id === id)
    if (idx === -1) return null
    contests[idx] = { ...contests[idx], ...updates }
    setStore("contests", contests)
    return contests[idx]
  },
  delete: (id: string) => {
    setStore("contests", getStore<Contest>("contests").filter((c) => c.id !== id))
  },
}

// ─── UserTeam Store ───────────────────────────────────────────────────────────

export const teamStore = {
  getAll: () => getStore<UserTeam>("user_teams"),
  getById: (id: string) => getStore<UserTeam>("user_teams").find((t) => t.id === id),
  getByUser: (userId: string) => getStore<UserTeam>("user_teams").filter((t) => t.userId === userId),
  getByMatch: (matchId: string) => getStore<UserTeam>("user_teams").filter((t) => t.matchId === matchId),
  create: (data: Omit<UserTeam, "id" | "createdAt" | "points">): UserTeam => {
    const teams = getStore<UserTeam>("user_teams")
    const team: UserTeam = { ...data, id: generateId(), points: 0, createdAt: new Date().toISOString() }
    setStore("user_teams", [...teams, team])
    return team
  },
}

// ─── Contest Entry Store ──────────────────────────────────────────────────────

export const entryStore = {
  getAll: () => getStore<ContestEntry>("entries"),
  getByContest: (contestId: string) => getStore<ContestEntry>("entries").filter((e) => e.contestId === contestId),
  getByUser: (userId: string) => getStore<ContestEntry>("entries").filter((e) => e.userId === userId),
  hasEntered: (userId: string, contestId: string) =>
    getStore<ContestEntry>("entries").some((e) => e.userId === userId && e.contestId === contestId),
  create: (data: Omit<ContestEntry, "id" | "createdAt">): ContestEntry => {
    const entries = getStore<ContestEntry>("entries")
    const entry: ContestEntry = { ...data, id: generateId(), createdAt: new Date().toISOString() }
    setStore("entries", [...entries, entry])
    return entry
  },
}

// ─── Transaction Store ────────────────────────────────────────────────────────

export const txStore = {
  getAll: () => getStore<Transaction>("transactions"),
  getByUser: (userId: string) => getStore<Transaction>("transactions").filter((t) => t.userId === userId),
  create: (data: Omit<Transaction, "id" | "createdAt" | "updatedAt">): Transaction => {
    const txs = getStore<Transaction>("transactions")
    const tx: Transaction = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setStore("transactions", [...txs, tx])
    return tx
  },
}

// ─── Deposit Request Store ────────────────────────────────────────────────────

export const depositStore = {
  getAll: () => getStore<DepositRequest>("deposit_requests"),
  getById: (id: string) => getStore<DepositRequest>("deposit_requests").find((d) => d.id === id),
  getByUser: (userId: string) => getStore<DepositRequest>("deposit_requests").filter((d) => d.userId === userId),
  getPending: () => getStore<DepositRequest>("deposit_requests").filter((d) => d.status === "pending"),
  create: (data: Omit<DepositRequest, "id" | "createdAt" | "updatedAt" | "status">): DepositRequest => {
    const deposits = getStore<DepositRequest>("deposit_requests")
    const deposit: DepositRequest = {
      ...data,
      id: generateId(),
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setStore("deposit_requests", [...deposits, deposit])
    return deposit
  },
  approve: (id: string, adminNote?: string): DepositRequest | null => {
    const deposits = getStore<DepositRequest>("deposit_requests")
    const idx = deposits.findIndex((d) => d.id === id)
    if (idx === -1) return null
    deposits[idx] = { ...deposits[idx], status: "approved", adminNote, updatedAt: new Date().toISOString() }
    setStore("deposit_requests", deposits)
    // Credit wallet
    const deposit = deposits[idx]
    userStore.creditWallet(deposit.userId, deposit.amount)
    // Create transaction record
    txStore.create({
      userId: deposit.userId,
      type: "deposit",
      amount: deposit.amount,
      status: "completed",
      utrNumber: deposit.utrNumber,
      notes: "Deposit approved",
    })
    // Refresh session if it's current user
    const cur = authStore.getCurrentUser()
    if (cur && cur.id === deposit.userId) authStore.refreshCurrentUser()
    return deposits[idx]
  },
  reject: (id: string, adminNote?: string): DepositRequest | null => {
    const deposits = getStore<DepositRequest>("deposit_requests")
    const idx = deposits.findIndex((d) => d.id === id)
    if (idx === -1) return null
    deposits[idx] = { ...deposits[idx], status: "rejected", adminNote, updatedAt: new Date().toISOString() }
    setStore("deposit_requests", deposits)
    return deposits[idx]
  },
}

// ─── Withdrawal Request Store ─────────────────────────────────────────────────

export const withdrawalStore = {
  getAll: () => getStore<WithdrawalRequest>("withdrawal_requests"),
  getById: (id: string) => getStore<WithdrawalRequest>("withdrawal_requests").find((w) => w.id === id),
  getByUser: (userId: string) =>
    getStore<WithdrawalRequest>("withdrawal_requests").filter((w) => w.userId === userId),
  getPending: () => getStore<WithdrawalRequest>("withdrawal_requests").filter((w) => w.status === "pending"),
  create: (data: Omit<WithdrawalRequest, "id" | "createdAt" | "updatedAt" | "status">): WithdrawalRequest | null => {
    const user = userStore.getById(data.userId)
    if (!user || user.walletBalance < data.amount) return null
    // Debit wallet immediately (hold)
    userStore.debitWallet(data.userId, data.amount)
    txStore.create({
      userId: data.userId,
      type: "withdrawal",
      amount: data.amount,
      status: "pending",
      notes: "Withdrawal requested",
    })
    const withdrawals = getStore<WithdrawalRequest>("withdrawal_requests")
    const withdrawal: WithdrawalRequest = {
      ...data,
      id: generateId(),
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setStore("withdrawal_requests", [...withdrawals, withdrawal])
    const cur = authStore.getCurrentUser()
    if (cur && cur.id === data.userId) authStore.refreshCurrentUser()
    return withdrawal
  },
  markPaid: (id: string, adminNote?: string): WithdrawalRequest | null => {
    const withdrawals = getStore<WithdrawalRequest>("withdrawal_requests")
    const idx = withdrawals.findIndex((w) => w.id === id)
    if (idx === -1) return null
    withdrawals[idx] = { ...withdrawals[idx], status: "paid", adminNote, updatedAt: new Date().toISOString() }
    setStore("withdrawal_requests", withdrawals)
    return withdrawals[idx]
  },
  reject: (id: string, adminNote?: string): WithdrawalRequest | null => {
    const withdrawals = getStore<WithdrawalRequest>("withdrawal_requests")
    const idx = withdrawals.findIndex((w) => w.id === id)
    if (idx === -1) return null
    withdrawals[idx] = { ...withdrawals[idx], status: "rejected", adminNote, updatedAt: new Date().toISOString() }
    setStore("withdrawal_requests", withdrawals)
    // Refund wallet
    userStore.creditWallet(withdrawals[idx].userId, withdrawals[idx].amount)
    const cur = authStore.getCurrentUser()
    if (cur && cur.id === withdrawals[idx].userId) authStore.refreshCurrentUser()
    return withdrawals[idx]
  },
}

// ─── Notification Store ───────────────────────────────────────────────────────

export const notificationStore = {
  getByUser: (userId: string) => getStore<Notification>("notifications").filter((n) => n.userId === userId),
  getUnreadCount: (userId: string) =>
    getStore<Notification>("notifications").filter((n) => n.userId === userId && !n.isRead).length,
  create: (data: Omit<Notification, "id" | "createdAt" | "isRead">): Notification => {
    const notifications = getStore<Notification>("notifications")
    const notification: Notification = {
      ...data,
      id: generateId(),
      isRead: false,
      createdAt: new Date().toISOString(),
    }
    setStore("notifications", [...notifications, notification])
    return notification
  },
  markRead: (id: string) => {
    const notifications = getStore<Notification>("notifications")
    const idx = notifications.findIndex((n) => n.id === id)
    if (idx === -1) return
    notifications[idx].isRead = true
    setStore("notifications", notifications)
  },
  markAllRead: (userId: string) => {
    const notifications = getStore<Notification>("notifications").map((n) =>
      n.userId === userId ? { ...n, isRead: true } : n
    )
    setStore("notifications", notifications)
  },
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

export function seedDatabase() {
  if (typeof window === "undefined") return
  if (localStorage.getItem("db_seeded") === "true") return

  // Admin user
  const adminExists = userStore.getByEmail("admin@fantasypro.com")
  if (!adminExists) {
    const admin: User = {
      id: generateId(),
      name: "Admin",
      email: "admin@fantasypro.com",
      phone: "9999999999",
      password: "admin123",
      role: "admin",
      walletBalance: 0,
      bonusBalance: 0,
      isVerified: true,
      createdAt: new Date().toISOString(),
    }
    const users = getStore<User>("users")
    setStore("users", [...users, admin])
  }

  // Demo user
  const demoExists = userStore.getByEmail("demo@fantasypro.com")
  if (!demoExists) {
    userStore.create({
      name: "Demo User",
      email: "demo@fantasypro.com",
      phone: "9876543210",
      password: "demo123",
      role: "user",
      avatar: "",
    })
  }

  // Seed matches
  const matchIds = [generateId(), generateId(), generateId()]
  const matches: Match[] = [
    {
      id: matchIds[0],
      sport: "cricket",
      title: "India vs Australia",
      teamA: "India",
      teamB: "Australia",
      teamAShort: "IND",
      teamBShort: "AUS",
      teamALogo: "🇮🇳",
      teamBLogo: "🇦🇺",
      startTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      status: "upcoming",
      series: "ICC World Cup 2025",
      venue: "Wankhede Stadium, Mumbai",
      createdAt: new Date().toISOString(),
    },
    {
      id: matchIds[1],
      sport: "cricket",
      title: "England vs South Africa",
      teamA: "England",
      teamB: "South Africa",
      teamAShort: "ENG",
      teamBShort: "SA",
      teamALogo: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      teamBLogo: "🇿🇦",
      startTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      status: "upcoming",
      series: "ICC World Cup 2025",
      venue: "Lord's Cricket Ground, London",
      createdAt: new Date().toISOString(),
    },
    {
      id: matchIds[2],
      sport: "football",
      title: "Manchester City vs Real Madrid",
      teamA: "Manchester City",
      teamB: "Real Madrid",
      teamAShort: "MCI",
      teamBShort: "RMA",
      teamALogo: "🔵",
      teamBLogo: "⚪",
      startTime: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
      status: "upcoming",
      series: "UEFA Champions League",
      venue: "Etihad Stadium, Manchester",
      createdAt: new Date().toISOString(),
    },
  ]
  setStore("matches", matches)

  // Seed players for match 0
  const cricketPlayers: Omit<Player, "id">[] = [
    { matchId: matchIds[0], name: "Rohit Sharma", team: "IND", role: "batsman", credits: 10, selectionPercentage: 78, points: 0, isPlaying: true },
    { matchId: matchIds[0], name: "Virat Kohli", team: "IND", role: "batsman", credits: 10.5, selectionPercentage: 85, points: 0, isPlaying: true },
    { matchId: matchIds[0], name: "Shubman Gill", team: "IND", role: "batsman", credits: 9, selectionPercentage: 45, points: 0, isPlaying: true },
    { matchId: matchIds[0], name: "KL Rahul", team: "IND", role: "wicket-keeper", credits: 9.5, selectionPercentage: 60, points: 0, isPlaying: true },
    { matchId: matchIds[0], name: "Hardik Pandya", team: "IND", role: "all-rounder", credits: 9, selectionPercentage: 55, points: 0, isPlaying: true },
    { matchId: matchIds[0], name: "Ravindra Jadeja", team: "IND", role: "all-rounder", credits: 9, selectionPercentage: 50, points: 0, isPlaying: true },
    { matchId: matchIds[0], name: "Jasprit Bumrah", team: "IND", role: "bowler", credits: 9.5, selectionPercentage: 72, points: 0, isPlaying: true },
    { matchId: matchIds[0], name: "Mohammed Shami", team: "IND", role: "bowler", credits: 8.5, selectionPercentage: 40, points: 0, isPlaying: true },
    { matchId: matchIds[0], name: "David Warner", team: "AUS", role: "batsman", credits: 9.5, selectionPercentage: 65, points: 0, isPlaying: true },
    { matchId: matchIds[0], name: "Steve Smith", team: "AUS", role: "batsman", credits: 10, selectionPercentage: 58, points: 0, isPlaying: true },
    { matchId: matchIds[0], name: "Pat Cummins", team: "AUS", role: "bowler", credits: 9, selectionPercentage: 48, points: 0, isPlaying: true },
    { matchId: matchIds[0], name: "Mitchell Starc", team: "AUS", role: "bowler", credits: 9, selectionPercentage: 52, points: 0, isPlaying: true },
    { matchId: matchIds[0], name: "Glenn Maxwell", team: "AUS", role: "all-rounder", credits: 9, selectionPercentage: 43, points: 0, isPlaying: true },
    { matchId: matchIds[0], name: "Alex Carey", team: "AUS", role: "wicket-keeper", credits: 8.5, selectionPercentage: 35, points: 0, isPlaying: true },
    { matchId: matchIds[0], name: "Josh Hazlewood", team: "AUS", role: "bowler", credits: 8.5, selectionPercentage: 30, points: 0, isPlaying: true },
  ]
  playerStore.createBulk(cricketPlayers)

  // Seed contests for match 0
  const contests: Omit<Contest, "id" | "createdAt" | "filledTeams">[] = [
    {
      matchId: matchIds[0],
      name: "Mega Contest",
      entryFee: 49,
      totalPrize: 5000000,
      maxTeams: 200000,
      firstPrize: 500000,
      prizeBreakdown: [
        { rank: "1st", prize: 500000 },
        { rank: "2nd", prize: 200000 },
        { rank: "3rd", prize: 100000 },
        { rank: "4-10", prize: 10000 },
        { rank: "11-100", prize: 1000 },
      ],
      type: "mega",
      isGuaranteed: true,
      status: "open",
    },
    {
      matchId: matchIds[0],
      name: "Head To Head",
      entryFee: 99,
      totalPrize: 180,
      maxTeams: 2,
      firstPrize: 180,
      prizeBreakdown: [{ rank: "1st", prize: 180 }],
      type: "head2head",
      isGuaranteed: false,
      status: "open",
    },
    {
      matchId: matchIds[0],
      name: "Small League",
      entryFee: 29,
      totalPrize: 50000,
      maxTeams: 5000,
      firstPrize: 15000,
      prizeBreakdown: [
        { rank: "1st", prize: 15000 },
        { rank: "2nd", prize: 8000 },
        { rank: "3-10", prize: 2000 },
      ],
      type: "small",
      isGuaranteed: false,
      status: "open",
    },
    {
      matchId: matchIds[0],
      name: "Practice Contest",
      entryFee: 0,
      totalPrize: 0,
      maxTeams: 10000,
      firstPrize: 0,
      prizeBreakdown: [],
      type: "free",
      isGuaranteed: false,
      status: "open",
    },
  ]
  contests.forEach((c) => contestStore.create(c))

  localStorage.setItem("db_seeded", "true")
}
