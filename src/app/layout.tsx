import type { Metadata } from "next";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://aryandokania.vercel.app/";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Aryan Dokania",
  description:
    "Interactive resume for Aryan Dokania featuring AI-assisted search across experience, projects, and skills.",
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
        url: "/opengraph-image",
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
    images: ["/opengraph-image"]
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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
