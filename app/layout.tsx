import type { Metadata } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { TopNav } from "@/components/nav/TopNav";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bottomline — track costs & earnings",
  description:
    "An open-source, self-hosted ledger for indie SaaS and side projects. Track every dollar in and out, watch your MRR, runway, and burn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TopNav />
        <main className="flex-1 w-full mx-auto max-w-6xl px-6 sm:px-10 pb-24 pt-8">
          {children}
        </main>
        <footer className="border-t border-hairline">
          <div className="w-full max-w-6xl mx-auto px-6 sm:px-10 py-6 flex items-center justify-between text-xs text-muted">
            <span className="tabular">bottomline · self-hosted ledger</span>
            <span className="tabular text-faint">v0.1</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
