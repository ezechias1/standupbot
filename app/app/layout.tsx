"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/submit", label: "Submit", icon: "✍️" },
  { href: "/feed", label: "Feed", icon: "📋" },
  { href: "/admin", label: "Admin", icon: "⚙️" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile nav is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen">
        {/* Mobile top bar */}
        <div
          className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
          style={{
            background: "rgba(0,0,0,0.95)",
            borderBottom: "1px solid var(--border)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              🤖
            </div>
            <span className="text-sm font-bold">StandupBot</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <span className="text-lg">{mobileOpen ? "✕" : "☰"}</span>
          </button>
        </div>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar — desktop: fixed, mobile: slide-in */}
        <nav
          className={`fixed h-screen flex flex-col z-50 transition-transform duration-300 ease-in-out w-60
            lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
          style={{
            background: "rgba(5,5,5,0.98)",
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

          <div className="p-4 mx-3 mb-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
            <p className="text-[10px] font-medium" style={{ color: "var(--text-secondary)" }}>
              Powered by
            </p>
            <p className="text-xs font-semibold mt-0.5 gradient-text">
              Next.js + Groq AI
            </p>
          </div>
        </nav>

        {/* Main content — offset for sidebar on desktop, full width on mobile */}
        <main className="lg:ml-60 min-h-screen relative z-10">
          <div className="p-4 pt-16 sm:p-6 sm:pt-18 lg:p-8 lg:pt-8 max-w-[1200px]">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
