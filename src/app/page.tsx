import Link from "next/link";
import { ProgressOverview, ResumeLessonCard } from "@/features/curriculum/progress-ui";
import { getLessons } from "@/features/curriculum/data";
import { loadCurriculum } from "@/features/curriculum/data/repository";

const modules = [
  { label: "Lộ trình học", detail: "Xây dựng nền tảng Python từng bước", icon: "◷", href: "/lo-trinh" },
  { label: "Thư viện tài liệu", detail: "Tài liệu tham khảo của bạn", icon: "▤", href: "/thu-vien" },
  { label: "AI gia sư", detail: "Đồng hành khi bạn cần gợi ý", icon: "✳", href: "/gia-su-ai" },
  { label: "Kiểm tra & thi thử", detail: "Luyện tập và tự đánh giá", icon: "✓", href: "/kiem-tra" },
  { label: "Flashcard", detail: "Ôn tập khái niệm theo cách riêng", icon: "▱", href: "/flashcard" },
  { label: "Ghi chú", detail: "Lưu lại điều bạn khám phá", icon: "▧", href: "/ghi-chu" },
];

export default async function DashboardPage() {
  const result = await loadCurriculum();
  const curriculum = result.status === "ready" ? result.curriculum : [];
  const lessonsCount = getLessons(curriculum).length;
  return <main className="content">
    <section className="welcome-card">
      <div className="welcome-copy"><p className="eyebrow">Chào mừng bạn đến với</p><h1>Một không gian để Python trở nên gần gũi hơn.</h1><p>Bắt đầu từ những điều căn bản, tiến bộ theo nhịp của riêng bạn.</p><Link className="button-light" href="/lo-trinh">Khám phá lộ trình <span aria-hidden="true">→</span></Link></div>
      <div className="welcome-art" aria-hidden="true">{`{ }`}</div>
    </section>

    {result.status === "ready" ? <ProgressOverview lessonCount={lessonsCount} /> : (
      <div className={result.status === "error" ? "error-state curriculum-dashboard-state" : "empty-state curriculum-dashboard-state"} role={result.status === "error" ? "alert" : "status"}>
        <p>{result.status === "empty" ? "Chưa có giáo trình trong Supabase. Hãy kiểm tra dữ liệu giáo trình đã được nạp chưa." : result.reason === "not-configured" ? "Chưa cấu hình kết nối Supabase cho môi trường đang chạy." : "Không thể tải giáo trình từ Supabase. Hãy kiểm tra bảng và chính sách đọc công khai."}</p>
      </div>
    )}

    <div className="section-row"><h2>Tiếp tục hành trình</h2><Link className="text-link" href="/lo-trinh">Xem lộ trình <span aria-hidden="true">→</span></Link></div>
    {result.status === "ready" ? <ResumeLessonCard curriculum={curriculum} /> : <div className="empty-state"><p>Chưa có bài học để tiếp tục.</p></div>}

    <div className="section-row"><h2>Công cụ học tập</h2></div>
    <div className="module-list">{modules.map((item) => <Link href={item.href} className="card module-card" key={item.href}><span className="module-icon" aria-hidden="true">{item.icon}</span><strong>{item.label}</strong><span>{item.detail}</span></Link>)}</div>
  </main>;
}
