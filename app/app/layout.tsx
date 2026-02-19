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
        <nav className="w-56 fixed h-screen flex flex-col border-r"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
          <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
            <h1 className="text-lg font-bold flex items-center gap-2">
              🤖 StandupBot
            </h1>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              Daily team check-ins
            </p>
          </div>

          <div className="flex-1 p-3 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active ? "nav-active" : "hover:bg-[var(--bg-hover)]"
                  }`}
                  style={!active ? { color: "var(--text-secondary)" } : {}}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="p-4 border-t text-xs" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
            Built with Next.js + Groq AI
          </div>
        </nav>

        {/* Main content */}
        <main className="ml-56 flex-1 p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
