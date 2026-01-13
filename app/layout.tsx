import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { LayoutDashboard, ArrowLeftRight, TrendingUp, History } from "lucide-react";

export const metadata: Metadata = {
  title: "Portfolio Tracker",
  description: "Track your investments across crypto, stocks, and ETFs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-gray-950 text-gray-100">
        <div className="flex">
          {/* Sidebar */}
          <aside className="w-64 min-h-screen bg-gray-900 border-r border-gray-800 p-4 flex flex-col">
            <div className="mb-8">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
                Portfolio Tracker
              </h1>
            </div>
            
            <nav className="space-y-2">
              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </Link>
              <Link
                href="/transactions"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <ArrowLeftRight className="w-5 h-5" />
                Transactions
              </Link>
              <Link
                href="/history"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <History className="w-5 h-5" />
                Historique
              </Link>
            </nav>

            <div className="mt-auto pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500 text-center">
                MVP v0.1.0
              </p>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
