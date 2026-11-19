import Link from "next/link";
import type { CurriculumResult } from "./data/repository";

export function CurriculumFeedback({ result, heading = "Giáo trình Python" }: { result: Exclude<CurriculumResult, { status: "ready" }>; heading?: string }) {
  const isError = result.status === "error";
  const message = result.status === "empty"
    ? "Chưa có nội dung giáo trình trong Supabase. Hãy kiểm tra dữ liệu khởi tạo sau khi schema và quyền truy cập đã sẵn sàng."
    : result.reason === "not-configured"
      ? "Chưa cấu hình kết nối Supabase cho môi trường đang chạy."
      : "Không thể tải giáo trình. Hãy kiểm tra bảng và chính sách đọc công khai trong Supabase rồi thử lại.";

  return (
    <main className="content curriculum-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Giáo trình Python</p>
          <h1>{heading}</h1>
          <p className="page-subtitle">Nội dung giáo trình được tải từ Supabase.</p>
        </div>
      </div>
      <section className={isError ? "error-state curriculum-feedback" : "empty-state curriculum-feedback"} role={isError ? "alert" : "status"}>
        <p>{message}</p>
        {isError && <Link className="button-secondary" href="/lo-trinh">Thử tải lại</Link>}
      </section>
    </main>
  );
}
