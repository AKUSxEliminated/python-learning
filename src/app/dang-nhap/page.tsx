import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="auth-shell">
      <section className="card auth-card" aria-labelledby="login-title">
        <Link className="auth-brand" href="/">
          <span className="brand-mark" aria-hidden="true">P</span>
          <span className="brand-name">Python Learning Hub</span>
        </Link>
        <p className="eyebrow">Không gian học tập cá nhân</p>
        <h1 id="login-title">Chào mừng trở lại</h1>
        <p className="page-subtitle">Đăng nhập để tiếp tục hành trình học tập.</p>
        <form className="auth-form">
          <label>Email<input type="email" placeholder="ban@example.com" autoComplete="email" /></label>
          <label>Mật khẩu<input type="password" placeholder="Nhập mật khẩu" autoComplete="current-password" /></label>
          <button type="button" className="button-primary" disabled>Đăng nhập</button>
        </form>
        <p className="auth-note">Đăng nhập chưa được kết nối ở giai đoạn này.</p>
        <p className="auth-switch">Chưa có tài khoản? <Link className="text-link" href="/dang-ky">Tạo tài khoản</Link></p>
      </section>
    </main>
  );
}
