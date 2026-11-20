import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter, Noto_Sans_Kannada } from "next/font/google";
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
  themeColor: "#0F172A",
};

export const metadata: Metadata = {
  title: "Aeterna CareerEdge",
  description:
    "Your Career. Your Future. One Passport. An AI-powered career and employability platform.",
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
      </body>
    </html>
  );
}
