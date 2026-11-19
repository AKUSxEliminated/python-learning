import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "Python Learning Hub",
  description: "Không gian học Python cá nhân, gọn gàng và tập trung.",
  applicationName: "Python Learning Hub",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const saved=localStorage.getItem("plh-theme");const dark=saved?saved==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.dataset.theme=dark?"dark":"light"}catch{document.documentElement.dataset.theme="light"}`,
          }}
        />
      </head>
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}
