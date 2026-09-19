"use client";

import { PersonCard } from "@/components/people/person-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { ContentItem, PersonItem, SourceStatus } from "@/types";
import { Link2, Pause, Play, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

type PersonForm = { name: string; role: string; organization: string; platform: PersonItem["platform"]; profileUrl: string; topics: string; sourceIds: string[] };
const emptyForm = (): PersonForm => ({ name: "", role: "", organization: "", platform: "github", profileUrl: "", topics: "", sourceIds: [] });

export function PeopleExplorer({ people, posts, sources }: { people: PersonItem[]; posts: ContentItem[]; sources: SourceStatus[] }) {
  const [items, setItems] = useState(people);
  const [platform, setPlatform] = useState<PersonItem["platform"] | "all">("all");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<"all" | "active" | "inactive">("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PersonItem | null>(null);
  const [form, setForm] = useState<PersonForm>(emptyForm);
  const filtered = useMemo(() => items.filter((person) => {
    if (platform !== "all" && person.platform !== platform) return false;
    if (active === "active" && !person.isActive) return false;
    if (active === "inactive" && person.isActive) return false;
    return !query || [person.name, person.role, person.organization ?? "", ...person.topics].join(" ").toLowerCase().includes(query.toLowerCase());
  }), [active, items, platform, query]);
  const latestSummary = (person: PersonItem) => posts.find((post) => (person.sourceIds ?? []).includes(post.originSourceId ?? "") || post.authors.some((author) => person.name.toLowerCase().includes(author.toLowerCase()) || author.toLowerCase().includes(person.name.toLowerCase())))?.summary;

  function toggleFormSource(sourceId: string) {
    setForm((value) => ({ ...value, sourceIds: value.sourceIds.includes(sourceId) ? value.sourceIds.filter((id) => id !== sourceId) : [...value.sourceIds, sourceId] }));
  }
  function startCreate() { setEditing(null); setForm(emptyForm()); setOpen(true); }
  function startEdit(person: PersonItem) {
    setEditing(person);
    setForm({ name: person.name, role: person.role, organization: person.organization ?? "", platform: person.platform, profileUrl: person.profileUrl, topics: person.topics.join(", "), sourceIds: person.sourceIds ?? [] });
    setOpen(true);
  }
  async function savePerson() {
    const body = { ...form, topics: form.topics.split(",").map((value) => value.trim()).filter(Boolean), isActive: editing?.isActive ?? true };
    const response = await fetch(editing ? `/api/people/${editing.id}` : "/api/people", { method: editing ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json();
    if (!response.ok) return;
    setItems((value) => editing ? value.map((item) => item.id === editing.id ? payload.data : item) : [...value, payload.data]);
    setOpen(false); setEditing(null); setForm(emptyForm());
  }
  async function toggle(person: PersonItem) {
    const response = await fetch(`/api/people/${person.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isActive: !person.isActive }) });
    const payload = await response.json();
    if (response.ok) setItems((value) => value.map((item) => item.id === person.id ? payload.data : item));
  }
  async function remove(person: PersonItem) {
    const response = await fetch(`/api/people/${person.id}`, { method: "DELETE" });
    if (response.ok) setItems((value) => value.filter((item) => item.id !== person.id));
  }

  return <div className="space-y-6">
    <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Filtreler</CardTitle><Button onClick={startCreate}><Plus className="h-4 w-4" />Kişi ekle</Button></CardHeader><CardContent className="grid gap-4 md:grid-cols-3"><div className="space-y-2"><Label>Platform</Label><Select value={platform} onChange={(event) => setPlatform(event.target.value as typeof platform)}><option value="all">Tümü</option><option value="linkedin">LinkedIn</option><option value="x">X</option><option value="github">GitHub</option><option value="other">Diğer</option></Select></div><div className="space-y-2"><Label>Durum</Label><Select value={active} onChange={(event) => setActive(event.target.value as typeof active)}><option value="all">Tümü</option><option value="active">Aktif</option><option value="inactive">Pasif</option></Select></div><div className="space-y-2"><Label>Ara</Label><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="isim, rol, konu..." /></div></CardContent></Card>
    <Badge tone="subtle">{filtered.length} kişi</Badge>
    {filtered.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((person) => <div key={person.id} className="space-y-2"><PersonCard person={person} latestPostSummary={latestSummary(person)} /><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => toggle(person)}>{person.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{person.isActive ? "Takibi durdur" : "Takibi başlat"}</Button><Button variant="outline" size="sm" onClick={() => startEdit(person)}><Link2 className="h-4 w-4" />Kaynaklar ({person.sourceIds?.length ?? 0})</Button><Button variant="ghost" size="icon" onClick={() => remove(person)} aria-label="Kişiyi sil"><Trash2 className="h-4 w-4" /></Button></div></div>)}</div> : <Card className="border-dashed"><CardContent className="p-8 text-sm text-muted-foreground">Henüz takip edilen kişi yok. GitHub veya RSS profili ekleyerek başlayın.</CardContent></Card>}
    <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) setEditing(null); }}><DialogContent><DialogHeader><DialogTitle>{editing ? "Kişiyi ve kaynaklarını düzenle" : "Takip edilecek kişi"}</DialogTitle></DialogHeader><div className="grid gap-3"><Input placeholder="Ad" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><Input placeholder="Rol" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} /><Input placeholder="Organizasyon" value={form.organization} onChange={(event) => setForm({ ...form, organization: event.target.value })} /><Select value={form.platform} onChange={(event) => setForm({ ...form, platform: event.target.value as PersonItem["platform"] })}><option value="github">GitHub</option><option value="x">X</option><option value="linkedin">LinkedIn</option><option value="other">Diğer</option></Select><Input placeholder="Public profil URL’si" value={form.profileUrl} onChange={(event) => setForm({ ...form, profileUrl: event.target.value })} /><Input placeholder="Konular, virgülle ayırın" value={form.topics} onChange={(event) => setForm({ ...form, topics: event.target.value })} /><div className="space-y-2"><Label>Timeline kaynakları</Label><div className="max-h-40 space-y-2 overflow-auto rounded-xl border p-3">{sources.length ? sources.map((source) => <label key={source.id} className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={form.sourceIds.includes(source.id)} onChange={() => toggleFormSource(source.id)} /><span>{source.name}</span><span className="text-xs text-muted-foreground">({source.type})</span></label>) : <p className="text-sm text-muted-foreground">Önce bir kaynak ekleyin.</p>}</div></div><Button onClick={savePerson}>{editing ? "Değişiklikleri kaydet" : "Kaydet"}</Button></div></DialogContent></Dialog>
  </div>;
}
