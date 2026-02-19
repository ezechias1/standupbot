"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/submit", label: "Submit", icon: "✍️" },
  { href: "/feed", label: "Feed", icon: "📋" },
  { href: "/admin", label: "Admin", icon: "⚙️" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <html lang="en">
      <body className="flex min-h-screen">
        {/* Sidebar */}
        <nav
          className="w-60 fixed h-screen flex flex-col z-50"
          style={{
            background: "rgba(5,5,5,0.97)",
            borderRight: "1px solid var(--border)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Logo */}
          <div className="p-6 pb-5">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                🤖
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight">StandupBot</h1>
                <p className="text-[10px] tracking-wider uppercase" style={{ color: "var(--text-secondary)" }}>
                  Team Check-ins
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-4 h-px" style={{ background: "var(--border)" }} />

          {/* Nav links */}
          <div className="flex-1 p-3 pt-4 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium ${
                    active ? "nav-active" : ""
                  }`}
                  style={!active ? { color: "var(--text-secondary)" } : {}}
                >
                  <span className="text-base w-5 text-center">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 mx-3 mb-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
            <p className="text-[10px] font-medium" style={{ color: "var(--text-secondary)" }}>
              Powered by
            </p>
            <p className="text-xs font-semibold mt-0.5 gradient-text">
              Next.js + Groq AI
            </p>
          </div>
        </nav>

        {/* Main content */}
        <main className="ml-60 flex-1 min-h-screen relative z-10">
          <div className="p-8 max-w-[1200px]">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
