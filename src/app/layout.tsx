import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aryan Dokania | Neural Resume Terminal",
  description:
    "Interactive resume for Aryan Dokania featuring AI-assisted search across experience, projects, and skills.",
  applicationName: "Aryan Dokania Resume",
  authors: [{ name: "Aryan Dokania" }],
  keywords: [
    "Aryan Dokania",
    "software engineer",
    "resume",
    "portfolio",
    "LLM",
    "RAG"
  ],
  openGraph: {
    title: "Aryan Dokania | Neural Resume Terminal",
    description:
      "AI-assisted resume experience for Aryan Dokania with searchable projects, experience, and skills.",
    url: "https://aryandokania.vercel.app",
    siteName: "Aryan Dokania Resume",
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Aryan Dokania | Neural Resume Terminal",
    description:
      "Interactive resume for Aryan Dokania with AI-assisted search over projects, experience, and skills."
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
