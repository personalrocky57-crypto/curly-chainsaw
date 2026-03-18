"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { notificationStore, type Notification } from "@/lib/db"
import { Bell, CheckCheck } from "lucide-react"

const TYPE_COLORS: Record<string, string> = {
  success: "bg-primary/10 border-primary/20 text-primary",
  info: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  warning: "bg-accent/10 border-accent/20 text-accent",
  error: "bg-destructive/10 border-destructive/20 text-destructive",
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])

  const load = () => {
    if (user) setNotifications(notificationStore.getByUser(user.id).reverse())
  }

  useEffect(() => { load() }, [user])

  const markAll = () => {
    if (user) { notificationStore.markAllRead(user.id); load() }
  }

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-foreground">Notifications</h2>
        {notifications.some((n) => !n.isRead) && (
          <button onClick={markAll} className="flex items-center gap-1 text-xs text-primary font-semibold">
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => { notificationStore.markRead(n.id); load() }}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${n.isRead ? "bg-card border-border opacity-70" : "bg-card border-border"}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.isRead ? "bg-border" : TYPE_COLORS[n.type].split(" ")[2]}`} />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground">{n.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{n.message}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
