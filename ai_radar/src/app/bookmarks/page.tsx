import { BookmarkExplorer } from "@/components/bookmarks/bookmark-explorer";
import { SectionHeader } from "@/components/shared/section-header";
import { StatCard } from "@/components/shared/stat-card";
import { getBookmarks } from "@/lib/services/content-service";
import { getBookmarkCollections } from "@/lib/services/trend-service";
import { Bookmark, FolderOpen, Star } from "lucide-react";

export const metadata = {
  title: "Kaydedilenler"
};
export const dynamic = "force-dynamic";

export default async function BookmarksPage() {
  const [items, collections] = await Promise.all([getBookmarks(), getBookmarkCollections()]);

  return (
    <div className="page-grid space-y-8">
      <SectionHeader
        eyebrow="Kaydedilenler"
        title="Kişisel araştırma arşivi"
        description="İçeriklerinizi cihazınızda saklayın, özel koleksiyonlar oluşturun ve araştırma arşivinizi düzenleyin."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Kaydedilen içerik" value={String(items.length)} icon={<Bookmark className="h-4 w-4" />} />
        <StatCard label="Koleksiyon" value={String(collections.length)} icon={<FolderOpen className="h-4 w-4" />} />
        <StatCard label="Öne çıkan" value={String(items.filter((item) => item.isFeatured).length)} icon={<Star className="h-4 w-4" />} />
      </div>

      <BookmarkExplorer collections={collections} items={items} />
    </div>
  );
}
