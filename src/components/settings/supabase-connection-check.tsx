"use client";

import { useState } from "react";

type CheckResult = "connected" | "not-configured" | "unavailable" | "schema-not-ready";

export function SupabaseConnectionCheck() {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);

  async function checkConnection() {
    setChecking(true);
    setResult(null);

    try {
      const response = await fetch("/api/supabase/health", { cache: "no-store" });
      const body: unknown = await response.json();

      if (typeof body !== "object" || body === null) {
        setResult("unavailable");
      } else {
        const status = body as Record<string, unknown>;
        if (status.configured === false) setResult("not-configured");
        else if (status.reachable === false) setResult("unavailable");
        else if (status.curriculumReadable === true) setResult("connected");
        else setResult("schema-not-ready");
      }
    } catch {
      setResult("unavailable");
    } finally {
      setChecking(false);
    }
  }

  const message: Record<CheckResult, string> = {
    connected: "Kết nối thành công. Bảng giáo trình cho phép đọc công khai.",
    "not-configured": "Chưa tìm thấy đủ cấu hình Supabase trên máy chủ.",
    unavailable: "Chưa thể kết nối Supabase. Hãy kiểm tra cấu hình và thử lại.",
    "schema-not-ready": "Đã kết nối nhưng chưa đọc được bảng learning_levels. Kiểm tra migration và quyền đọc công khai.",
  };

  return (
    <section className="card supabase-check-card" aria-labelledby="supabase-check-title">
      <div>
        <p className="eyebrow">Tích hợp dữ liệu</p>
        <h2 id="supabase-check-title">Kết nối Supabase</h2>
        <p className="supabase-check-description">
          Kiểm tra quyền đọc bảng giáo trình bằng truy vấn chỉ đọc. Kết quả không hiển thị URL, key hay thông tin lỗi từ máy chủ.
        </p>
      </div>
      <button className="button-primary" type="button" onClick={checkConnection} disabled={checking}>
        {checking ? "Đang kiểm tra…" : "Kiểm tra kết nối"}
      </button>
      {result && (
        <p className="supabase-check-result" role="status" aria-live="polite">
          {message[result]}
        </p>
      )}
    </section>
  );
}
