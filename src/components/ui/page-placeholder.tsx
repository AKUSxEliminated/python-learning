export function PagePlaceholder({ title, subtitle, icon }: { title: string; subtitle: string; icon: string }) {
  return (
    <main className="content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Không gian học tập</p>
          <h1>{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
      </div>
      <section className="card placeholder-card" aria-labelledby="placeholder-title">
        <div className="placeholder-icon" aria-hidden="true">{icon}</div>
        <h2 id="placeholder-title">{title}</h2>
        <p>Khu vực này đã sẵn sàng cho nội dung của bạn. Các tính năng học tập sẽ được bổ sung trong giai đoạn tiếp theo.</p>
      </section>
    </main>
  );
}
