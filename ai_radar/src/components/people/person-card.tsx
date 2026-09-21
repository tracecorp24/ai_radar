import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/formatters";
import type { PersonItem } from "@/types";
import { ArrowUpRight, MessageSquareText, ScanFace } from "lucide-react";
import Link from "next/link";
import { TagList } from "../shared/tag-list";

function platformLabel(platform: PersonItem["platform"]) {
  switch (platform) {
    case "linkedin":
      return "LinkedIn";
    case "github":
      return "GitHub";
    case "x":
      return "X";
    default:
      return "Other";
  }
}

export function PersonCard({
  person,
  latestPostSummary
}: {
  person: PersonItem;
  latestPostSummary?: string;
}) {
  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-soft">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-primary/15 to-cyan-500/15 font-semibold text-primary">
              {person.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="editorial-title truncate">{person.name}</CardTitle>
              <CardDescription className="truncate">
                {person.role}
                {person.organization ? ` · ${person.organization}` : ""}
              </CardDescription>
            </div>
          </div>
          <Badge tone={person.isActive ? "success" : "subtle"} className="shrink-0">{person.isActive ? "Takipte" : "Pasif"}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge tone="subtle">{platformLabel(person.platform)}</Badge>
          <Badge tone="subtle">{person.newPostCount} yeni gönderi</Badge>
          {person.lastCheckedAt ? <Badge tone="subtle">Kontrol: {formatDateTime(person.lastCheckedAt)}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
          {latestPostSummary ?? "Bu kişi için yeni bir gönderi bulunamadı."}
        </p>
        <TagList tags={person.topics.slice(0, 4)} compact />
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={`/people/${person.id}`}>
              Profili aç
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={person.profileUrl} target="_blank" rel="noreferrer">
              Gönderiyi aç
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function PersonPostCard({
  person,
  summary,
  postedAt
}: {
  person: PersonItem;
  summary: string;
  postedAt: string;
}) {
  return (
    <Card className="group h-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-soft">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">{person.name}</CardTitle>
            <CardDescription>
              {platformLabel(person.platform)} · {person.role}
            </CardDescription>
          </div>
          <ScanFace className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="line-clamp-4 text-sm leading-6 text-muted-foreground">{summary}</p>
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{formatDate(postedAt)}</span>
          <Badge tone="warning">
            <MessageSquareText className="mr-1 h-3 w-3" />
            Yeni gönderi
          </Badge>
        </div>
        <Button asChild variant="outline" size="sm" className="w-full">
          <a href={person.profileUrl} target="_blank" rel="noreferrer">
            Gönderiyi aç
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

