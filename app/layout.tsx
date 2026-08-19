// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "DrainGuard AI — DIPS",
  description:
    "AI-powered drainage intelligence and preventive system for Lagos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-screen bg-[#0A0E17] text-slate-100 font-sans flex flex-col lg:flex-row overflow-x-hidden selection:bg-emerald-500 selection:text-black">
        <ConvexClientProvider>
          {/* Main App Container */}
          <div className="flex w-full min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 bg-[#0B0F19]">
              {children}
            </div>
          </div>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
