"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore, type ReactNode } from "react";

const navigation = [
  { label: "Tổng quan", href: "/", icon: "⌂" },
  { label: "Lộ trình học", href: "/lo-trinh", icon: "◷" },
  { label: "Thư viện tài liệu", href: "/thu-vien", icon: "▤" },
  { label: "AI gia sư", href: "/gia-su-ai", icon: "✳" },
  { label: "Kiểm tra & thi thử", href: "/kiem-tra", icon: "✓" },
  { label: "Flashcard", href: "/flashcard", icon: "▱" },
  { label: "Ghi chú", href: "/ghi-chu", icon: "▧" },
  { label: "Cài đặt", href: "/cai-dat", icon: "⚙" },
];

function subscribeToTheme(onChange: () => void) {
  window.addEventListener("plh-theme-change", onChange);
  return () => window.removeEventListener("plh-theme-change", onChange);
}

function getThemeSnapshot() {
  return document.documentElement.dataset.theme === "dark";
}

function getServerThemeSnapshot() {
  return false;
}

function ThemeButton({ onToggle }: { onToggle: () => void }) {
  const dark = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);

  return (
    <button
      className="icon-button"
      type="button"
      onClick={onToggle}
      aria-label={dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      title={dark ? "Giao diện sáng" : "Giao diện tối"}
    >
      {dark ? "☼" : "☾"}
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAuth = pathname.startsWith("/dang-");

  function toggleTheme() {
    const nextDark = document.documentElement.dataset.theme !== "dark";
    document.documentElement.dataset.theme = nextDark ? "dark" : "light";
    localStorage.setItem("plh-theme", nextDark ? "dark" : "light");
    window.dispatchEvent(new Event("plh-theme-change"));
  }

  if (isAuth) {
    return (
      <div className="app-shell">
        <div className="auth-tools"><ThemeButton onToggle={toggleTheme} /></div>
        {children}
      </div>
    );
  }

  const activePath = pathname.startsWith("/hoc/") ? "/lo-trinh" : pathname;
  const current = navigation.find((item) => item.href === activePath)?.label ?? "Không gian học tập";

  return (
    <div className="app-shell">
      <button
        className={`mobile-overlay${menuOpen ? " visible" : ""}`}
        type="button"
        onClick={() => setMenuOpen(false)}
        aria-label="Đóng menu điều hướng"
        tabIndex={menuOpen ? 0 : -1}
      />
      <aside className={`sidebar${menuOpen ? " open" : ""}`} id="primary-sidebar">
        <Link className="brand" href="/" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark" aria-hidden="true">P</span>
          <span>
            <span className="brand-name">Python Learning Hub</span>
            <span className="brand-caption">Your learning space</span>
          </span>
        </Link>
        <p className="nav-label">Không gian học</p>
        <nav className="nav-list" aria-label="Điều hướng chính">
          {navigation.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href) || (item.href === "/lo-trinh" && pathname.startsWith("/hoc/"));
            return (
              <Link
                key={item.href}
                className={`nav-link${active ? " active" : ""}`}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
              >
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <strong>Học theo nhịp của bạn</strong>
            <p>Mỗi bước nhỏ hôm nay sẽ tạo nên nền tảng vững chắc ngày mai.</p>
          </div>
          <div className="profile">
            <div className="avatar" aria-hidden="true">P</div>
            <div><strong>Góc học tập cá nhân</strong><span>Chưa đăng nhập</span></div>
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Mở menu điều hướng"
            aria-controls="primary-sidebar"
            aria-expanded={menuOpen}
          >
            ☰
          </button>
          <div className="breadcrumb">Không gian học tập <span aria-hidden="true" style={{ padding: "0 7px", opacity: .5 }}>/</span> {current}</div>
          <div className="top-actions">
            <ThemeButton onToggle={toggleTheme} />
            <Link className="button-secondary" href="/dang-nhap">Đăng nhập</Link>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
