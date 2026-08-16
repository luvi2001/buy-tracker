import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buy Tracker",
  description: "Buy order production tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-line bg-panel px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <div>
              <p className="text-xs mono uppercase tracking-[0.2em] text-accent">Production</p>
              <h1 className="text-xl font-semibold">Buy Order Tracker</h1>
            </div>
            <nav className="flex gap-2 text-sm mono">
              <a href="/" className="px-3 py-1.5 rounded border border-line hover:border-accent hover:text-accent transition-colors">
                Dashboard
              </a>
              <a
                href="/orders/new"
                className="px-3 py-1.5 rounded bg-accent text-panel font-semibold hover:opacity-90 transition-opacity"
              >
                + New Entry
              </a>
            </nav>
          </header>
          <main className="px-6 py-8 max-w-[1400px] mx-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
