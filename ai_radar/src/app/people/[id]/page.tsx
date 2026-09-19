import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared/section-header";
import { TagList } from "@/components/shared/tag-list";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { getPersonById, getPersonTimeline } from "@/lib/services/person-service";
import { notFound } from "next/navigation";
import { ArrowUpRight, History } from "lucide-react";

export default async function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [person, timeline] = await Promise.all([getPersonById(id), getPersonTimeline(id)]);

  if (!person) {
    notFound();
  }

  return (
    <div className="page-grid grid gap-8 xl:grid-cols-[1.35fr_0.65fr]">
      <div className="space-y-8">
        <SectionHeader eyebrow="Kişi detay" title={person.name} description={`${person.role}${person.organization ? ` · ${person.organization}` : ""}`} />

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={person.isActive ? "success" : "subtle"}>{person.isActive ? "Aktif" : "Pasif"}</Badge>
              <Badge tone="subtle">{person.platform}</Badge>
              <Badge tone="subtle">{person.newPostCount} yeni gönderi</Badge>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>Son kontrol: {formatDateTime(person.lastCheckedAt)}</span>
              <span>Son gönderi: {formatDate(person.lastPostAt)}</span>
            </div>
            <TagList tags={person.topics} />
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <a href={person.profileUrl} target="_blank" rel="noreferrer">
                  <ArrowUpRight className="h-4 w-4" />
                  Profili aç
                </a>
              </Button>
            </div>
          </CardHeader>
        </Card>

        <section className="space-y-4">
          <SectionHeader eyebrow="Gönderi geçmişi" title="Timeline" />
          <div className="space-y-3">
            {timeline.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <CardTitle className="text-base">{post.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>{post.summary}</p>
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    <span>{formatDate(post.date)}</span>
                    <Badge tone="subtle">{post.platform}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profil özeti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Rol</span>
              <span className="font-medium">{person.role}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Platform</span>
              <span className="font-medium">{person.platform}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Kurum</span>
              <span className="font-medium">{person.organization ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Takip durumu</span>
              <span className="font-medium">{person.isActive ? "Takipte" : "Pasif"}</span>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
