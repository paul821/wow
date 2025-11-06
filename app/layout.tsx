import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "WOW — Workout of the Week",
  description: "Auto-picks a minimal-equipment, full-body WOD from last week"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        <main className="mx-auto max-w-3xl p-6">{children}</main>
      </body>
    </html>
  );
}
