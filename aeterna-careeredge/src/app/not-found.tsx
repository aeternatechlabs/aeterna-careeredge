import Link from "next/link";
import { ArrowLeft, Home, Compass, LifeBuoy } from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-[#FFF8F6] px-4 py-8 text-center sm:px-6 sm:py-12">
      {/* Background soft ambient glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#7A0F1F]/5 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#F6B51C]/10 blur-3xl"
      />

      {/* Top Navbar Header */}
      <header className="w-full max-w-5xl flex items-center justify-between pb-6">
        <BrandLogo tone="light" href="/" />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A0F1F] hover:underline"
        >
          <Home size={14} />
          <span>Home</span>
        </Link>
      </header>

      {/* Center 404 Card */}
      <div className="relative my-auto flex w-full max-w-lg flex-col items-center rounded-3xl border border-[#EBDDD1] bg-white p-8 shadow-xl sm:p-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FCE9E8] text-[#7A0F1F] shadow-xs">
          <span className="font-heading text-2xl font-black tracking-tight">404</span>
        </div>

        <span className="mt-5 inline-block rounded-full bg-[#FCE9E8] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#7A0F1F]">
          Page Not Found
        </span>

        <h1 className="mt-4 font-heading text-2xl font-extrabold text-[#2B1B1B] sm:text-3xl">
          Lost in your journey?
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-[#765F5D]">
          The career page or document you are looking for doesn&apos;t exist, has been
          relocated, or is temporarily unavailable.
        </p>

        {/* Primary CTA Buttons */}
        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#7A0F1F] px-6 text-sm font-bold text-white shadow-md shadow-[#7A0F1F]/20 transition-all hover:bg-[#520914] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
          >
            <ArrowLeft size={16} />
            <span>Return to Home</span>
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#EBDDD1] bg-white px-5 text-sm font-semibold text-[#352020] transition-colors hover:bg-[#FDF7F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
          >
            <Compass size={16} className="text-[#7A0F1F]" />
            <span>Go to Dashboard</span>
          </Link>
        </div>

        {/* Helpful links */}
        <div className="mt-8 w-full border-t border-[#EBDDD1]/60 pt-6">
          <p className="text-xs font-medium text-[#9A8580]">Need assistance?</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-[#7A0F1F]">
            <Link href="/#features" className="hover:underline">
              Features
            </Link>
            <span>•</span>
            <Link href="/privacy-policy" className="hover:underline">
              Privacy Policy
            </Link>
            <span>•</span>
            <a
              href="mailto:info@aeternatechlabs.com"
              className="inline-flex items-center gap-1 hover:underline"
            >
              <LifeBuoy size={12} />
              <span>Contact Support</span>
            </a>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <footer className="w-full max-w-5xl pt-6 text-xs text-[#9A8580]">
        © {new Date().getFullYear()} Aeterna CareerEdge. All rights reserved.
      </footer>
    </main>
  );
}
