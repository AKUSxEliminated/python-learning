import { SupabaseConnectionCheck } from "@/components/settings/supabase-connection-check";

export default function SettingsPage() {
  return (
    <main className="content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Không gian học tập</p>
          <h1>Cài đặt</h1>
          <p className="page-subtitle">Quản lý cấu hình và kết nối cho không gian học tập của bạn.</p>
        </div>
      </div>
      <SupabaseConnectionCheck />
    </main>
  );
}
