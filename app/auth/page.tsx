"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, AuthProvider } from "@/lib/auth-context"
import { Trophy, Eye, EyeOff, Zap, Users } from "lucide-react"

function AuthForm() {
  const router = useRouter()
  const { login, register } = useAuth()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" })

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))

    if (mode === "login") {
      const res = login(form.email, form.password)
      if (res.success) {
        const u = JSON.parse(localStorage.getItem("current_user") || "{}")
        router.push(u.role === "admin" ? "/admin" : "/dashboard")
      } else {
        setError(res.error || "Login failed")
      }
    } else {
      if (!form.name || !form.email || !form.phone || !form.password) {
        setError("All fields are required.")
        setLoading(false)
        return
      }
      if (form.phone.length !== 10) {
        setError("Enter a valid 10-digit phone number.")
        setLoading(false)
        return
      }
      const res = register(form.name, form.email, form.phone, form.password)
      if (res.success) router.push("/dashboard")
      else setError(res.error || "Registration failed")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0d1525] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,213,99,0.15),transparent_60%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground tracking-tight">FantasyPro</span>
          </div>
          <h1 className="text-5xl font-bold text-foreground leading-tight mb-6">
            Win Big with<br />
            <span className="text-primary">Fantasy Sports</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
            Create fantasy teams, join exciting contests, and win real cash prizes every day on cricket, football, kabaddi and more.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { icon: Users, label: "10M+ Players", sub: "Active users" },
            { icon: Trophy, label: "₹50Cr+", sub: "Prize pool daily" },
            { icon: Zap, label: "100+ Contests", sub: "Every match" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="bg-secondary/50 border border-border rounded-xl p-4">
              <Icon className="w-5 h-5 text-primary mb-2" />
              <div className="text-foreground font-bold">{label}</div>
              <div className="text-muted-foreground text-xs">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Trophy className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">FantasyPro</span>
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-2">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {mode === "login" ? "Sign in to your account to continue" : "Join millions of fantasy players today"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                required
              />
            </div>
            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number</label>
                <div className="flex gap-2">
                  <span className="bg-secondary border border-border rounded-xl px-3 py-3 text-muted-foreground text-sm flex items-center">+91</span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit mobile number"
                    className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-destructive text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed glow-green mt-2"
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-muted-foreground mt-6 text-sm">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError("") }}
              className="text-primary font-semibold hover:underline"
            >
              {mode === "login" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <AuthProvider>
      <AuthForm />
    </AuthProvider>
  )
}
