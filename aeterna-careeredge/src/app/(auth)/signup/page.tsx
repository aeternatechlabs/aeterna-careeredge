"use client";

import Link from "next/link";
import { useState, useEffect, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  UserRound,
  Mail,
  Lock,
  type LucideIcon,
} from "lucide-react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  type Variants,
} from "motion/react";
import AuthLayout from "@/components/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ── Style tokens ──────────────────────────────────────────────────────────────

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

// ── Sub-components ────────────────────────────────────────────────────────────

function FormField({
  id,
  label,
  icon: Icon,
  children,
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <motion.div variants={fadeUp}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="group relative">
        <Icon aria-hidden="true" className={iconClass} />
        {children}
      </div>
    </motion.div>
  );
}

function PasswordInput({
  id,
  placeholder,
  value,
  onChange,
  invalid,
  describedBy,
}: {
  id: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <>
      <Input
        id={id}
        name={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} pr-11`}
        autoComplete="new-password"
        aria-invalid={invalid}
        aria-describedby={describedBy}
        required
      />
      <motion.button
        type="button"
        whileTap={{ scale: 0.85 }}
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md text-[#9A8580] transition-colors hover:text-[#7A0F1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </motion.button>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsConsent, setTermsConsent] = useState(false);
  const [counsellorConsent, setCounsellorConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [nextUrl, setNextUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlNext = params.get("next");
      if (urlNext) setNextUrl(urlNext);
    }
  }, []);

  const mismatch =
    confirmPassword.length > 0 && confirmPassword !== password;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mismatch) return;

    setError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          mobile: `+91${mobile}`,
          password,
          counsellorConsent,
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        field?: string;
        user?: { onboardingCompleted: boolean };
      };

      if (!res.ok) {
        if (data.field) {
          setFieldErrors({ [data.field]: data.error ?? "Invalid value." });
        } else {
          setError(data.error ?? "Signup failed. Please try again.");
        }
        return;
      }

      // New users always go to onboarding
      router.push("/onboarding");
    } catch {
      setError("Could not connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout activeTab="signup">
      <MotionConfig reducedMotion="user">
        <div>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mb-7"
          >
            <h1 className="text-3xl font-bold tracking-tight text-[#2B1B1B]">
              Create your student account
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#765F5D]">
              Start building your Career Passport and take the next step towards
              your future.
            </p>
          </motion.div>

          <motion.form
            variants={formVariants}
            initial="hidden"
            animate="show"
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Full name */}
            <FormField id="signup-name" label="Full Student Name" icon={UserRound}>
              <Input
                id="signup-name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                autoComplete="name"
                required
                error={fieldErrors.name}
              />
            </FormField>

            {/* Email */}
            <FormField id="signup-email" label="Email Address" icon={Mail}>
              <Input
                id="signup-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                autoComplete="email"
                required
                error={fieldErrors.email}
              />
            </FormField>

            {/* Mobile with +91 prefix */}
            <motion.div variants={fadeUp}>
              <label htmlFor="signup-mobile" className={labelClass}>
                Mobile Number
              </label>
              <div className="group flex">
                <span className="flex h-12 items-center rounded-l-xl border border-r-0 border-[#EBDDD1] bg-[#f8efe7] px-3 text-sm font-medium text-[#765F5D]">
                  +91
                </span>
                <Input
                  id="signup-mobile"
                  name="mobile"
                  type="tel"
                  placeholder="98765 43210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="h-12 flex-1 rounded-l-none rounded-r-xl border-[#EBDDD1] bg-white pl-3"
                  autoComplete="tel"
                  inputMode="numeric"
                  required
                  error={fieldErrors.mobile}
                />
              </div>
            </motion.div>

            {/* Password */}
            <FormField id="signup-password" label="Password" icon={Lock}>
              <PasswordInput
                id="signup-password"
                placeholder="Create a password (min 8 characters)"
                value={password}
                onChange={setPassword}
              />
            </FormField>

            {/* Confirm password */}
            <div>
              <FormField
                id="signup-confirm-password"
                label="Confirm Password"
                icon={Lock}
              >
                <PasswordInput
                  id="signup-confirm-password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  invalid={mismatch}
                  describedBy={mismatch ? "confirm-password-error" : undefined}
                />
              </FormField>

              <AnimatePresence initial={false}>
                {mismatch && (
                  <motion.p
                    id="confirm-password-error"
                    role="alert"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden pt-2 text-xs font-medium text-red-700"
                  >
                    Passwords do not match.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Terms & Privacy consent (required) */}
            <motion.label
              variants={fadeUp}
              className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#765F5D]"
            >
              <input
                type="checkbox"
                required
                checked={termsConsent}
                onChange={(e) => setTermsConsent(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[#7A0F1F]"
              />
              <span>
                I agree to the{" "}
                <Link
                  href="/terms-and-conditions"
                  className="font-semibold text-[#7A0F1F] underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy-policy"
                  className="font-semibold text-[#7A0F1F] underline"
                >
                  Privacy Policy
                </Link>
                . <span className="text-[#9A8580]">(required)</span>
              </span>
            </motion.label>

            {/* Counsellor contact consent (optional) */}
            <motion.label
              variants={fadeUp}
              className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#765F5D]"
            >
              <input
                type="checkbox"
                checked={counsellorConsent}
                onChange={(e) => setCounsellorConsent(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[#7A0F1F]"
              />
              <span>
                I am open to being contacted by a career counsellor from Aeterna
                CareerEdge for guidance and opportunities.{" "}
                <span className="text-[#9A8580]">(optional)</span>
              </span>
            </motion.label>

            {/* Global error */}
            <AnimatePresence initial={false}>
              {error && (
                <motion.div
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

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
                disabled={mismatch}
                className="h-12 rounded-xl bg-[#7A0F1F] text-base font-semibold text-white shadow-md shadow-[#7A0F1F]/20 hover:bg-[#4C0915]"
              >
                {loading ? "Creating account…" : "Create Career Passport"}
              </Button>
            </motion.div>

            {/* Social divider */}
            <motion.div variants={fadeUp} className="relative my-5 flex items-center justify-center">
              <div className="w-full border-t border-[#EBDDD1]" />
              <span className="absolute bg-[#FFF8F6] px-3 text-xs font-semibold uppercase tracking-wider text-[#9A8580]">
                Or register with
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

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-7 text-center text-sm text-[#765F5D]"
          >
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-[#7A0F1F] hover:underline"
            >
              Login here
            </Link>
          </motion.p>
        </div>
      </MotionConfig>
    </AuthLayout>
  );
}
