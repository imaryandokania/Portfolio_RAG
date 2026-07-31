import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap"
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://aryandokania.vercel.app/";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Aryan Dokania — Research Engineer @ Microsoft",
  description:
    "Aryan Dokania — Research Engineer at Microsoft (Copilot Studio), MS CS from UC San Diego. Interactive AI-powered portfolio with RAG search across experience, projects, and research.",
  applicationName: "Aryan Dokania",
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
    title: "Aryan Dokania",
    description:
      "AI-assisted resume experience for Aryan Dokania with searchable projects, experience, and skills.",
    url: siteUrl,
    siteName: "Aryan Dokania",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Aryan Dokania - AI-assisted resume search experience"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Aryan Dokania",
    description:
      "Interactive resume for Aryan Dokania with AI-assisted search over projects, experience, and skills.",
    images: ["/og-image.png"]
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
      <body className={`${jetbrainsMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
