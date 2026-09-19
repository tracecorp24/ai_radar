"use client";
import { ContentCard } from "@/components/content/content-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BookmarkCollection, ContentItem } from "@/types";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

export function BookmarkExplorer({ collections, items }: { collections: BookmarkCollection[]; items: ContentItem[] }) {
  const [groups, setGroups] = useState(collections);
  const [selected, setSelected] = useState(collections[0]?.id ?? "later");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const current = useMemo(() => groups.find((collection) => collection.id === selected) ?? groups[0], [groups, selected]);
  const filtered = items.filter((item) => current?.itemIds.includes(item.id) || (selected === "later" && item.isBookmarked));
  async function create() { if (name.trim().length < 2) return; const response = await fetch("/api/collections", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, description }) }); const payload = await response.json(); if (response.ok) { setGroups((value) => [...value, payload.data]); setSelected(payload.data.id); setName(""); setDescription(""); setOpen(false); } }
  async function removeCollection() { if (!current || current.id === "later") return; const response = await fetch(`/api/collections?id=${encodeURIComponent(current.id)}`, { method: "DELETE" }); if (response.ok) { setGroups((value) => value.filter((group) => group.id !== current.id)); setSelected("later"); } }
  async function toggleItem(item: ContentItem) { if (!current || current.id === "later") return; const included = current.itemIds.includes(item.id); await fetch(`/api/collections/${current.id}/items/${item.id}`, { method: included ? "DELETE" : "POST" }); setGroups((value) => value.map((group) => group.id === current.id ? { ...group, itemIds: included ? group.itemIds.filter((id) => id !== item.id) : [...group.itemIds, item.id] } : group)); }
  function beginEdit() { if (!current || current.id === "later") return; setEditName(current.name); setEditDescription(current.description); setEditOpen(true); }
  async function saveEdit() { if (!current || editName.trim().length < 2) return; const response=await fetch("/api/collections",{ method:"PATCH",headers:{ "content-type":"application/json" },body:JSON.stringify({ id:current.id,name:editName,description:editDescription }) }); const payload=await response.json(); if(response.ok){ setGroups((value)=>value.map((group)=>group.id===current.id ? payload.data : group)); setEditOpen(false); } }
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center gap-2">{groups.map((collection) => <Button key={collection.id} variant={collection.id === selected ? "default" : "outline"} size="sm" onClick={() => setSelected(collection.id)}>{collection.name}</Button>)}<Button variant="outline" size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Yeni koleksiyon</Button></div>
    <Card><CardHeader className="flex flex-row items-start justify-between gap-3"><div><CardTitle className="text-base">{current?.name ?? "Koleksiyon"}</CardTitle><p className="mt-2 text-sm text-muted-foreground">{current?.description}</p></div>{current?.id !== "later" ? <div className="flex gap-1"><Button variant="ghost" size="icon" onClick={beginEdit} aria-label="Koleksiyonu düzenle"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={removeCollection} aria-label="Koleksiyonu sil"><Trash2 className="h-4 w-4" /></Button></div> : null}</CardHeader><CardContent><Badge tone="subtle">{filtered.length} içerik</Badge></CardContent></Card>
    {filtered.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <div key={item.id} className="space-y-2"><ContentCard content={item} />{current?.id !== "later" ? <Button variant="outline" size="sm" onClick={() => toggleItem(item)}>Koleksiyondan çıkar</Button> : null}</div>)}</div> : <Card className="border-dashed"><CardContent className="p-8 text-sm text-muted-foreground">Bu koleksiyonda henüz içerik yok.</CardContent></Card>}
    {current?.id !== "later" ? <Card><CardHeader><CardTitle className="text-base">Kaydedilenlerden ekle</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{items.filter((item) => !current?.itemIds.includes(item.id)).map((item) => <Button key={item.id} variant="outline" size="sm" onClick={() => toggleItem(item)}>{item.title.slice(0, 42)}</Button>)}</CardContent></Card> : null}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Yeni koleksiyon</DialogTitle></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label>Ad</Label><Input value={name} onChange={(event) => setName(event.target.value)} /></div><div className="space-y-2"><Label>Açıklama</Label><Input value={description} onChange={(event) => setDescription(event.target.value)} /></div><Button onClick={create}>Koleksiyonu oluştur</Button></div></DialogContent></Dialog>
    <Dialog open={editOpen} onOpenChange={setEditOpen}><DialogContent><DialogHeader><DialogTitle>Koleksiyonu düzenle</DialogTitle></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label>Ad</Label><Input value={editName} onChange={(event)=>setEditName(event.target.value)} /></div><div className="space-y-2"><Label>Açıklama</Label><Input value={editDescription} onChange={(event)=>setEditDescription(event.target.value)} /></div><Button onClick={saveEdit}>Değişiklikleri kaydet</Button></div></DialogContent></Dialog>
  </div>;
}
