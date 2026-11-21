import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter, Noto_Sans_Kannada } from "next/font/google";
import { CookieConsentBanner } from "@/components/shared/cookie-consent-banner";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoKannada = Noto_Sans_Kannada({
  variable: "--font-noto-kannada",
  subsets: ["kannada"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#7A0F1F",
};

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://careeredge.aeternatechlabs.com";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Aeterna CareerEdge | AI-Powered Career & Employability Platform",
    template: "%s | Aeterna CareerEdge",
  },
  description:
    "Build your career with AI-powered resume tools, skill development, job matching and guided employability preparation. Your Career. Your Future. One Passport.",
  applicationName: "Aeterna CareerEdge",
  authors: [{ name: "Aeterna CareerEdge" }],
  keywords: [
    "CareerEdge",
    "Aeterna",
    "AI Resume Studio",
    "Career Passport",
    "Employability Platform",
    "Student Placement",
    "Resume Builder",
    "Study Abroad Guidance",
    "Job Matching",
  ],
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon-32x32.png",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: appUrl,
    siteName: "Aeterna CareerEdge",
    title: "Aeterna CareerEdge | AI-Powered Career & Employability Platform",
    description:
      "Build your career with AI-powered resume tools, skill development, job matching and guided employability preparation.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Aeterna CareerEdge - AI-Powered Career & Employability Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aeterna CareerEdge | AI-Powered Career & Employability Platform",
    description:
      "Build your career with AI-powered resume tools, skill development, job matching and guided employability preparation.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${plusJakarta.variable} ${inter.variable} ${notoKannada.variable} min-h-dvh antialiased selection:bg-[#7A0F1F] selection:text-white`}
      >
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
