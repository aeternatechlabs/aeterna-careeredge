"use client";

import Link from "next/link";
import { useState, useEffect, type FormEvent } from "react";
import { Eye, EyeOff, Mail, Phone, Lock } from "lucide-react";
import {
  MotionConfig,
  motion,
  type Variants,
} from "motion/react";
import AuthLayout from "@/components/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ── Shared style tokens (mirror signup page) ──────────────────────────────────

const inputClass = "h-12 rounded-xl border-[#EBDDD1] bg-white pl-10";
const labelClass = "mb-2 block text-sm font-semibold text-[#352020]";
const iconClass =
  "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A8580] transition-colors duration-200 group-focus-within:text-[#7A0F1F]";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const formVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};

// ── Login form types ──────────────────────────────────────────────────────────

type IdentifierMode = "email" | "mobile";

export default function LoginPage() {
  const [identifierMode, setIdentifierMode] = useState<IdentifierMode>("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextUrl, setNextUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get("error");
      const urlEmail = params.get("email");
      const urlNext = params.get("next");
      if (urlNext) setNextUrl(urlNext);
      if (urlError || urlEmail) {
        const timer = setTimeout(() => {
          if (urlError) setError(decodeURIComponent(urlError));
          if (urlEmail) setIdentifier(decodeURIComponent(urlEmail));
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // ── Form submit ───────────────────────────────────────────────────────────

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError(
        identifierMode === "email"
          ? "Please enter your email address."
          : "Please enter your mobile number."
      );
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const payload =
        identifierMode === "mobile"
          ? { identifier: identifier.replace(/^\+91\s?/, "").replace(/\s/g, ""), password }
          : { identifier: identifier.trim().toLowerCase(), password };

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as {
        error?: string;
        user?: { onboardingCompleted: boolean };
      };

      if (!res.ok) {
        setError(data.error ?? "Login failed. Please try again.");
        return;
      }

      // Hard redirect to ensure HTTP-only session cookie is sent on first request
      // and bypass any stale client-side router cache.
      const searchParams = new URLSearchParams(window.location.search);
      const nextUrl = searchParams.get("next");
      const destination =
        nextUrl && nextUrl.startsWith("/") && !nextUrl.startsWith("//")
          ? nextUrl
          : data.user?.onboardingCompleted
          ? "/dashboard"
          : "/onboarding";

      window.location.href = destination;
    } catch {
      setError("Could not connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AuthLayout activeTab="login">
      <MotionConfig reducedMotion="user">
        <div>
          {/* Heading */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mb-7"
          >
            <h1 className="text-3xl font-bold tracking-tight text-[#2B1B1B]">
              Welcome back
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#765F5D]">
              Log in to continue your Career Passport journey.
            </p>
          </motion.div>

          <motion.form
            variants={formVariants}
            initial="hidden"
            animate="show"
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Identifier toggle */}
            <motion.div variants={fadeUp}>
              <div className="mb-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setIdentifierMode("email"); setIdentifier(""); }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    identifierMode === "email"
                      ? "bg-[#7A0F1F] text-white"
                      : "bg-[#FCE9E8] text-[#765F5D] hover:text-[#7A0F1F]"
                  }`}
                >
                  <Mail size={12} />
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => { setIdentifierMode("mobile"); setIdentifier(""); }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    identifierMode === "mobile"
                      ? "bg-[#7A0F1F] text-white"
                      : "bg-[#FCE9E8] text-[#765F5D] hover:text-[#7A0F1F]"
                  }`}
                >
                  <Phone size={12} />
                  Mobile
                </button>
              </div>

              <label htmlFor="login-identifier" className={labelClass}>
                {identifierMode === "email" ? "Email Address" : "Mobile Number"}
              </label>

              <div className="group relative">
                {identifierMode === "email" ? (
                  <Mail aria-hidden="true" className={iconClass} />
                ) : (
                  <Phone aria-hidden="true" className={iconClass} />
                )}

                {identifierMode === "mobile" ? (
                  <div className="flex">
                    <span className="flex h-12 items-center rounded-l-xl border border-r-0 border-[#EBDDD1] bg-[#f8efe7] px-3 text-sm font-medium text-[#765F5D]">
                      +91
                    </span>
                    <Input
                      id="login-identifier"
                      name="identifier"
                      type="tel"
                      placeholder="98765 43210"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="h-12 flex-1 rounded-l-none rounded-r-xl border-[#EBDDD1] bg-white pl-3"
                      autoComplete="tel"
                      inputMode="numeric"
                      maxLength={10}
                    />
                  </div>
                ) : (
                  <Input
                    id="login-identifier"
                    name="identifier"
                    type="email"
                    placeholder="you@example.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className={inputClass}
                    autoComplete="email"
                  />
                )}
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={fadeUp}>
              <label htmlFor="login-password" className={labelClass}>
                Password
              </label>
              <div className="group relative">
                <Lock aria-hidden="true" className={iconClass} />
                <Input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-11`}
                  autoComplete="current-password"
                />
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md text-[#9A8580] transition-colors hover:text-[#7A0F1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </motion.button>
              </div>
            </motion.div>

            {/* Remember me + Forgot password */}
            <motion.div
              variants={fadeUp}
              className="flex items-center justify-between"
            >
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[#765F5D]">
                <input
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer accent-[#7A0F1F]"
                />
                Remember me
              </label>

              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-[#7A0F1F] hover:underline"
              >
                Forgot password?
              </Link>
            </motion.div>

            {/* Error message */}
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 animate-in fade-in duration-200"
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Button
                type="submit"
                fullWidth
                loading={loading}
                className="h-12 rounded-xl bg-[#7A0F1F] text-base font-semibold text-white shadow-md shadow-[#7A0F1F]/20 hover:bg-[#4C0915]"
              >
                {loading ? "Logging in…" : "Log In"}
              </Button>
            </motion.div>

            {/* Social divider */}
            <motion.div variants={fadeUp} className="relative my-5 flex items-center justify-center">
              <div className="w-full border-t border-[#EBDDD1]" />
              <span className="absolute bg-[#FFF8F6] px-3 text-xs font-semibold uppercase tracking-wider text-[#9A8580]">
                Or continue with
              </span>
            </motion.div>

            {/* Google Sign-in */}
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <a
                href={nextUrl ? `/api/auth/oauth/google?next=${encodeURIComponent(nextUrl)}` : "/api/auth/oauth/google"}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#EBDDD1] bg-white text-sm font-semibold text-[#352020] shadow-sm transition hover:bg-[#FDF7F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </a>
            </motion.div>
          </motion.form>

          {/* Sign up link */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-7 text-center text-sm text-[#765F5D]"
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-bold text-[#7A0F1F] hover:underline"
            >
              Create one here
            </Link>
          </motion.p>

          {/* Legal navigation links */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-6 border-t border-[#EBDDD1]/60 pt-4 text-center text-xs text-[#9A8580]"
          >
            By signing in, you agree to our{" "}
            <Link
              href="/terms-and-conditions"
              className="text-[#7A0F1F] underline hover:text-[#520914]"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy-policy"
              className="text-[#7A0F1F] underline hover:text-[#520914]"
            >
              Privacy Policy
            </Link>
            .
          </motion.div>
        </div>
      </MotionConfig>
    </AuthLayout>
  );
}
