"use client"

import { useState, useEffect, useRef } from "react"
import { Settings, Upload, Save, CheckCircle2, QrCode, Smartphone, Building2, Trash2 } from "lucide-react"

const SETTINGS_KEY = "company_payment_settings"

interface PaymentSettings {
  upiId: string
  companyName: string
  phone: string
  qrImageBase64: string
  minDeposit: number
  minWithdrawal: number
}

const DEFAULT_SETTINGS: PaymentSettings = {
  upiId: "fantasypro@upi",
  companyName: "FantasyPro India Pvt. Ltd.",
  phone: "9876543210",
  qrImageBase64: "",
  minDeposit: 50,
  minWithdrawal: 100,
}

export function getPaymentSettings(): PaymentSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

function savePaymentSettings(s: PaymentSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PaymentSettings>(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSettings(getPaymentSettings())
  }, [])

  const set = (k: keyof PaymentSettings, v: string | number) =>
    setSettings((p) => ({ ...p, [k]: v }))

  const handleSave = () => {
    savePaymentSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2 MB")
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      set("qrImageBase64", base64)
    }
    reader.readAsDataURL(file)
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Payment Settings</h2>
          <p className="text-xs text-muted-foreground">Configure UPI details and QR code shown to users during deposit</p>
        </div>
      </div>

      {/* QR Code Upload */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <QrCode className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Company QR Code</h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Preview */}
          <div className="flex-shrink-0">
            <div className="w-40 h-40 bg-white rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
              {settings.qrImageBase64 ? (
                <img
                  src={settings.qrImageBase64}
                  alt="Company QR code for payment"
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <div className="text-center p-3">
                  <QrCode className="w-10 h-10 text-muted-foreground/40 mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground">No QR uploaded</p>
                </div>
              )}
            </div>
            {settings.qrImageBase64 && (
              <button
                onClick={() => set("qrImageBase64", "")}
                className="mt-2 w-full flex items-center justify-center gap-1 text-xs text-destructive hover:underline"
              >
                <Trash2 className="w-3 h-3" /> Remove
              </button>
            )}
          </div>

          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`flex-1 min-h-[160px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
              dragOver
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50 hover:bg-secondary/50"
            }`}
          >
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-foreground">Click to upload QR</p>
            <p className="text-xs text-muted-foreground mt-1">or drag and drop here</p>
            <p className="text-[10px] text-muted-foreground mt-2">PNG, JPG up to 2 MB</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* UPI & Company Details */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Smartphone className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">UPI & Contact Details</h3>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">UPI ID</label>
          <input
            type="text"
            value={settings.upiId}
            onChange={(e) => set("upiId", e.target.value)}
            placeholder="e.g. company@ybl"
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm font-mono"
          />
          <p className="text-[10px] text-muted-foreground mt-1">This UPI ID is shown on the deposit page for users to pay</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Contact Phone (for UPI)</label>
          <input
            type="tel"
            value={settings.phone}
            onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="10-digit phone"
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm font-mono"
          />
        </div>
      </div>

      {/* Company Name */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Company Information</h3>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Company / Payee Name</label>
          <input
            type="text"
            value={settings.companyName}
            onChange={(e) => set("companyName", e.target.value)}
            placeholder="e.g. FantasyPro India Pvt. Ltd."
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm"
          />
          <p className="text-[10px] text-muted-foreground mt-1">Displayed under the QR code as the payee name</p>
        </div>
      </div>

      {/* Limits */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-foreground">Transaction Limits</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Min Deposit (₹)</label>
            <input
              type="number"
              value={settings.minDeposit}
              onChange={(e) => set("minDeposit", Number(e.target.value))}
              min={1}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Min Withdrawal (₹)</label>
            <input
              type="number"
              value={settings.minWithdrawal}
              onChange={(e) => set("minWithdrawal", Number(e.target.value))}
              min={1}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary text-sm"
            />
          </div>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-all ${
          saved
            ? "bg-primary/20 border border-primary/30 text-primary"
            : "bg-primary text-primary-foreground hover:bg-primary/90 glow-green"
        }`}
      >
        {saved ? (
          <><CheckCircle2 className="w-4 h-4" /> Settings Saved!</>
        ) : (
          <><Save className="w-4 h-4" /> Save Settings</>
        )}
      </button>
    </div>
  )
}
