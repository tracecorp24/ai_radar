import { PeopleExplorer } from "@/components/people/people-explorer";
import { SectionHeader } from "@/components/shared/section-header";
import { StatCard } from "@/components/shared/stat-card";
import { getPeople } from "@/lib/services/person-service";
import { getLatestPeoplePosts } from "@/lib/services/content-service";
import { getSources } from "@/lib/services/source-service";
import { Users, MessageSquareText, Radar } from "lucide-react";

export const metadata = {
  title: "Kişiler"
};
export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const [people, posts, sources] = await Promise.all([getPeople(), getLatestPeoplePosts(), getSources()]);
  const active = people.filter((person) => person.isActive).length;
  const newPosts = people.reduce((sum, person) => sum + person.newPostCount, 0);

  return (
    <div className="page-grid space-y-8">
      <SectionHeader
        eyebrow="Kişiler"
        title="Takip edilen hesaplar ve son gönderiler"
        description="Public profil ve konu bilgileriyle kişisel takip listenizi tamamen local olarak yönetin."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Takip edilen kişi" value={String(people.length)} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Aktif hesap" value={String(active)} icon={<Radar className="h-4 w-4" />} />
        <StatCard label="Yeni gönderi" value={String(newPosts)} icon={<MessageSquareText className="h-4 w-4" />} />
      </div>

      <PeopleExplorer people={people} posts={posts} sources={sources} />
    </div>
  );
}
