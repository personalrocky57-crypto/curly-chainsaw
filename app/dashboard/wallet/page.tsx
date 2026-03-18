"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { depositStore, withdrawalStore, txStore, type Transaction } from "@/lib/db"
import { Wallet, ArrowDownCircle, ArrowUpCircle, CheckCircle2, Copy, Check, QrCode } from "lucide-react"
import { getPaymentSettings } from "@/app/admin/settings/page"

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2000, 5000]

export default function WalletPage() {
  const { user, refreshUser } = useAuth()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") === "withdraw" ? "withdraw" : "deposit"
  const [tab, setTab] = useState<"deposit" | "withdraw" | "history">(defaultTab as any)

  // Deposit form
  const [depositAmount, setDepositAmount] = useState("")
  const [utrNumber, setUtrNumber] = useState("")
  const [depositLoading, setDepositLoading] = useState(false)
  const [depositSuccess, setDepositSuccess] = useState(false)
  const [depositError, setDepositError] = useState("")

  // Withdrawal form
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawMethod, setWithdrawMethod] = useState<"upi" | "bank">("upi")
  const [upiId, setUpiId] = useState("")
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [ifscCode, setIfscCode] = useState("")
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [withdrawSuccess, setWithdrawSuccess] = useState(false)
  const [withdrawError, setWithdrawError] = useState("")

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [copied, setCopied] = useState(false)
  const [paySettings, setPaySettings] = useState(getPaymentSettings())

  useEffect(() => {
    if (user) setTransactions(txStore.getByUser(user.id).reverse())
    setPaySettings(getPaymentSettings())
  }, [user, tab])

  const copyUPI = () => {
    navigator.clipboard.writeText(paySettings.upiId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const submitDeposit = async () => {
    setDepositError("")
    const amt = parseFloat(depositAmount)
    const minDep = paySettings.minDeposit || 50
    if (!amt || amt < minDep) { setDepositError(`Minimum deposit is ₹${minDep}.`); return }
    if (!utrNumber.trim() || utrNumber.trim().length < 8) { setDepositError("Enter a valid UTR/Reference number."); return }
    if (!user) return
    setDepositLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    depositStore.create({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      amount: amt,
      utrNumber: utrNumber.trim(),
    })
    setDepositLoading(false)
    setDepositSuccess(true)
    setDepositAmount("")
    setUtrNumber("")
  }

  const submitWithdrawal = async () => {
    setWithdrawError("")
    const amt = parseFloat(withdrawAmount)
    const minWith = paySettings.minWithdrawal || 100
    if (!amt || amt < minWith) { setWithdrawError(`Minimum withdrawal is ₹${minWith}.`); return }
    if ((user?.walletBalance ?? 0) < amt) { setWithdrawError("Insufficient deposit balance."); return }
    if (withdrawMethod === "upi" && !upiId.trim()) { setWithdrawError("Enter your UPI ID."); return }
    if (withdrawMethod === "bank" && (!bankName || !accountNumber || !ifscCode)) { setWithdrawError("Fill all bank details."); return }
    if (!user) return
    setWithdrawLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    const res = withdrawalStore.create({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      amount: amt,
      method: withdrawMethod,
      upiId: withdrawMethod === "upi" ? upiId : undefined,
      bankName: withdrawMethod === "bank" ? bankName : undefined,
      accountNumber: withdrawMethod === "bank" ? accountNumber : undefined,
      ifscCode: withdrawMethod === "bank" ? ifscCode : undefined,
    })
    setWithdrawLoading(false)
    if (!res) { setWithdrawError("Failed to submit request. Check your balance."); return }
    refreshUser()
    setWithdrawSuccess(true)
    setWithdrawAmount("")
  }

  const balance = user?.walletBalance ?? 0
  const bonus = user?.bonusBalance ?? 0

  return (
    <div className="px-4 py-4">
      {/* Balance cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gradient-to-br from-[#0d2a1a] to-card border border-primary/20 rounded-2xl p-4 glow-green">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Deposit Balance</span>
          </div>
          <div className="text-2xl font-black text-primary">₹{balance.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Withdrawable</div>
        </div>
        <div className="bg-gradient-to-br from-[#2a1a0d] to-card border border-accent/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-accent" />
            <span className="text-xs text-muted-foreground">Bonus Balance</span>
          </div>
          <div className="text-2xl font-black text-accent">₹{bonus.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Use in contests</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-6">
        {(["deposit", "withdraw", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setDepositSuccess(false); setWithdrawSuccess(false) }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* DEPOSIT TAB */}
      {tab === "deposit" && !depositSuccess && (
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-2xl p-4">
            <h3 className="text-sm font-bold text-foreground mb-3">Pay to Company UPI</h3>
            {/* QR Code */}
            <div className="flex justify-center mb-4">
              <div className="bg-white p-2 rounded-xl border-4 border-primary/30 w-44 h-44 flex items-center justify-center overflow-hidden">
                {paySettings.qrImageBase64 ? (
                  <img
                    src={paySettings.qrImageBase64}
                    alt="Scan this QR code to pay via UPI"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-1" />
                    <p className="text-[9px] text-gray-500">QR not set by admin</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between bg-secondary rounded-xl px-3 py-2.5 mb-2">
              <div>
                <div className="text-xs text-muted-foreground">UPI ID</div>
                <div className="text-sm font-mono font-bold text-foreground">{paySettings.upiId}</div>
              </div>
              <button onClick={copyUPI} className="text-xs text-primary font-semibold flex items-center gap-1">
                {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center">Pay to: <span className="text-foreground font-medium">{paySettings.companyName}</span></p>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Quick Select Amount</label>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map((a) => (
                <button key={a} onClick={() => setDepositAmount(String(a))}
                  className={`py-2 rounded-xl text-sm font-bold border transition-colors ${depositAmount === String(a) ? "bg-primary/20 border-primary text-primary" : "bg-secondary border-border text-foreground hover:border-primary/40"}`}>
                  ₹{a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Amount (₹)</label>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Enter amount (min ₹50)"
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">UTR / Reference Number</label>
            <input
              type="text"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              placeholder="Enter 12-digit UTR number"
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">Find UTR in your payment app under transaction history</p>
          </div>

          {depositError && <p className="text-destructive text-xs">{depositError}</p>}

          <button
            onClick={submitDeposit}
            disabled={depositLoading}
            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors glow-green"
          >
            {depositLoading ? "Submitting..." : "Submit Deposit Request"}
          </button>
          <p className="text-xs text-muted-foreground text-center">Admin will verify and approve within 30 minutes</p>
        </div>
      )}

      {tab === "deposit" && depositSuccess && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Request Submitted!</h3>
          <p className="text-muted-foreground text-sm mb-6">Your deposit request has been submitted. Admin will verify and credit your account within 30 minutes.</p>
          <button onClick={() => setDepositSuccess(false)} className="text-primary font-semibold text-sm underline">Submit Another</button>
        </div>
      )}

      {/* WITHDRAW TAB */}
      {tab === "withdraw" && !withdrawSuccess && (
        <div className="space-y-5">
          <div className="bg-secondary/50 border border-border rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Available to withdraw</span>
            <span className="text-lg font-black text-primary">₹{balance.toFixed(2)}</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Withdrawal Amount (₹)</label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Min ₹100"
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Payment Method</label>
            <div className="flex gap-2">
              {(["upi", "bank"] as const).map((m) => (
                <button key={m} onClick={() => setWithdrawMethod(m)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${withdrawMethod === m ? "bg-primary/20 border-primary text-primary" : "bg-secondary border-border text-muted-foreground"}`}>
                  {m === "upi" ? "UPI" : "Bank Transfer"}
                </button>
              ))}
            </div>
          </div>

          {withdrawMethod === "upi" ? (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@upi"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm font-mono"
              />
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: "Bank Name", value: bankName, set: setBankName, placeholder: "e.g. HDFC Bank" },
                { label: "Account Number", value: accountNumber, set: setAccountNumber, placeholder: "12-digit account number" },
                { label: "IFSC Code", value: ifscCode, set: setIfscCode, placeholder: "e.g. HDFC0001234" },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
                  <input type="text" value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm" />
                </div>
              ))}
            </div>
          )}

          {withdrawError && <p className="text-destructive text-xs">{withdrawError}</p>}

          <button
            onClick={submitWithdrawal}
            disabled={withdrawLoading}
            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {withdrawLoading ? "Processing..." : "Submit Withdrawal Request"}
          </button>
          <p className="text-xs text-muted-foreground text-center">Processing time: 24–48 hours after admin approval</p>
        </div>
      )}

      {tab === "withdraw" && withdrawSuccess && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Request Submitted!</h3>
          <p className="text-muted-foreground text-sm mb-6">Your withdrawal request is under review. Funds will be transferred within 24–48 hours.</p>
          <button onClick={() => setWithdrawSuccess(false)} className="text-primary font-semibold text-sm underline">New Request</button>
        </div>
      )}

      {/* HISTORY TAB */}
      {tab === "history" && (
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No transactions yet.</div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tx.type === "deposit" || tx.type === "prize_won" || tx.type === "bonus" ? "bg-primary/10" : "bg-destructive/10"}`}>
                    {tx.type === "deposit" || tx.type === "prize_won" || tx.type === "bonus"
                      ? <ArrowDownCircle className="w-4 h-4 text-primary" />
                      : <ArrowUpCircle className="w-4 h-4 text-destructive" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground capitalize">{tx.type.replace("_", " ")}</div>
                    <div className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                    {tx.notes && <div className="text-xs text-muted-foreground">{tx.notes}</div>}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${tx.type === "deposit" || tx.type === "prize_won" || tx.type === "bonus" ? "text-primary" : "text-destructive"}`}>
                    {tx.type === "deposit" || tx.type === "prize_won" || tx.type === "bonus" ? "+" : "-"}₹{tx.amount.toFixed(2)}
                  </div>
                  <div className={`text-[10px] font-medium ${tx.status === "completed" ? "text-primary" : tx.status === "pending" ? "text-accent" : "text-destructive"}`}>
                    {tx.status === "completed" ? "Success" : tx.status === "pending" ? "Pending" : "Failed"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
