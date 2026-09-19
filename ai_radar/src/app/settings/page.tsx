import { SectionHeader } from "@/components/shared/section-header";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { OperationsPanel } from "@/components/settings/operations-panel";
import { LlmConnectionCard } from "@/components/settings/llm-connection-card";
import packageJson from "../../../package.json";

export const metadata = {
  title: "Ayarlar"
};
export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div className="page-grid space-y-8">
      <SectionHeader
        eyebrow="Ayarlar"
        title="Local çalışma alanı ve trend tercihleri"
        description="Kişisel araştırma tercihleri, veri kaynakları, deterministik trend ağırlıkları ve local yedekler."
      />

      <SettingsPanel version={packageJson.version} />
      <LlmConnectionCard />
      <OperationsPanel />
    </div>
  );
}
