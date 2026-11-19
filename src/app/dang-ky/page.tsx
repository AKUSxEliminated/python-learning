import Link from "next/link";

export default function RegistrationPage() {
  return (
    <main className="auth-shell">
      <section className="card auth-card" aria-labelledby="register-title">
        <Link className="auth-brand" href="/">
          <span className="brand-mark" aria-hidden="true">P</span>
          <span className="brand-name">Python Learning Hub</span>
        </Link>
        <p className="eyebrow">Bắt đầu hành trình</p>
        <h1 id="register-title">Tạo không gian của bạn</h1>
        <p className="page-subtitle">Bắt đầu xây dựng thói quen học Python của riêng mình.</p>
        <form className="auth-form">
          <label>Tên hiển thị<input type="text" placeholder="Tên của bạn" autoComplete="name" /></label>
          <label>Email<input type="email" placeholder="ban@example.com" autoComplete="email" /></label>
          <label>Mật khẩu<input type="password" placeholder="Tạo mật khẩu" autoComplete="new-password" /></label>
          <button type="button" className="button-primary" disabled>Tạo tài khoản</button>
        </form>
        <p className="auth-note">Đăng ký chưa được kết nối ở giai đoạn này.</p>
        <p className="auth-switch">Đã có tài khoản? <Link className="text-link" href="/dang-nhap">Đăng nhập</Link></p>
      </section>
    </main>
  );
}
