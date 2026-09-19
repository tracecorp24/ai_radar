"use client";
import { Button } from "@/components/ui/button";
import { Bell, Check, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Notification = { id: string; title: string; detail: string; href?: string; isRead: boolean; createdAt: string };
export function NotificationCenter() {
  const [open,setOpen] = useState(false); const [items,setItems] = useState<Notification[]>([]);
  useEffect(() => { fetch("/api/notifications").then((response) => response.json()).then((payload) => setItems(payload.data ?? [])).catch(() => undefined); }, []);
  async function markRead(id?: string) { await fetch("/api/notifications", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(id ? { id } : {}) }); setItems((value) => value.map((item) => !id || item.id === id ? { ...item,isRead:true } : item)); }
  async function remove(id: string) { await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, { method: "DELETE" }); setItems((value) => value.filter((item) => item.id !== id)); }
  const unread = items.filter((item) => !item.isRead).length;
  return <div className="relative"><Button variant="outline" size="icon" aria-label={`Bildirimler${unread ? `, ${unread} okunmamış` : ""}`} onClick={() => setOpen((value) => !value)}><Bell className="h-4 w-4" />{unread ? <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] text-primary-foreground">{unread}</span> : null}</Button>{open ? <div className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-border bg-background p-3 shadow-soft"><div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold">Bildirimler</p>{unread ? <Button variant="ghost" size="sm" onClick={() => markRead()}><Check className="h-3.5 w-3.5" />Tümünü okundu yap</Button> : null}</div>{items.length ? <div className="max-h-96 space-y-2 overflow-auto">{items.map((item) => <div key={item.id} className={`relative rounded-xl border p-3 transition ${item.isRead ? "border-border bg-muted/20" : "border-primary/30 bg-primary/5"}`}><Link href={item.href ?? "/"} onClick={() => { setOpen(false); markRead(item.id); }} className="block pr-8"><p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.detail}</p></Link><Button variant="ghost" size="icon" className="absolute right-1 top-1 h-7 w-7" onClick={() => remove(item.id)} aria-label="Bildirimi sil"><X className="h-3.5 w-3.5" /></Button></div>)}</div> : <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Henüz bildirim yok.</p>}</div> : null}</div>;
}
