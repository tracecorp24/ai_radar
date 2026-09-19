import { mockPeople } from "@/data/mock-people";
import { getStoredPerson, listContent, listPeople, upsertPerson } from "@/lib/local-db";
import type { PersonItem } from "@/types";

function ensureDemo() { if (!listPeople().length && process.env.SAVVY_DEMO_MODE === "true") mockPeople.forEach(upsertPerson); }
export async function getPeople(): Promise<PersonItem[]> { ensureDemo(); return listPeople(); }
export async function getPersonById(id: string) { ensureDemo(); return getStoredPerson(id); }
export async function getPersonTimeline(id: string): Promise<Array<{ id: string; date: string; title: string; summary: string; platform: PersonItem["platform"] }>> { const person = await getPersonById(id); if (!person) return []; const linked=new Set(person.sourceIds ?? []); return listContent({ limit:500 }).filter((item) => linked.has(item.originSourceId ?? "") || item.authors.some((author) => author.toLowerCase().includes(person.name.toLowerCase()) || person.name.toLowerCase().includes(author.toLowerCase()))).map((item) => ({ id:item.id,date:item.publishedAt,title:item.title,summary:item.summary,platform:person.platform })); }
export async function getActivePeople() { return (await getPeople()).filter((person) => person.isActive); }
