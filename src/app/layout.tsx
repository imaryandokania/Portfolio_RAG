import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Permanent_Marker, Pinyon_Script, Silkscreen } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap"
});

// Decorative faces for the mixed-media wordmark in the opening
const scriptFont = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
  display: "swap"
});

const markerFont = Permanent_Marker({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-marker",
  display: "swap"
});

const pixelFont = Silkscreen({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pixel",
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
    type: "website"
  },
  twitter: {
    card: "summary",
    title: "Aryan Dokania",
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
        className={`${inter.variable} ${jetbrainsMono.variable} ${scriptFont.variable} ${markerFont.variable} ${pixelFont.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
