"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  LockKeyhole,
} from "lucide-react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  type Variants,
} from "motion/react";

const cities = ["Bengaluru", "Mysuru", "Belagavi", "Other"];

const statuses = ["Final-year student", "Graduate", "Working professional"];

const interests = ["Study abroad", "Jobs", "Both"];

const checklist = [
  "Free to get started",
  "Career and study guidance",
  "You choose whether to seek counselling",
];

const labelClass = "mb-2 block text-sm font-semibold text-foreground";

const inputClass =
  "w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-foreground outline-none transition placeholder:text-text-muted hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/10 sm:text-sm";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const arrowVariants: Variants = {
  rest: { x: 0 },
  hover: { x: 4 },
};

function SelectField({
  id,
  name,
  label,
  placeholder,
  options,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  options: string[];
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label} <span className="text-error">*</span>
      </label>
      <div className="relative">
        <select
          id={id}
          name={name}
          required
          defaultValue=""
          className={`${inputClass} appearance-none pr-11`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-muted"
        />
      </div>
    </div>
  );
}

export function LeadCaptureSection() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [requiredConsent, setRequiredConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: formData.get("name") as string,
      mobile: formData.get("mobile") as string,
      email: formData.get("email") as string,
      city: formData.get("city") as string,
      status: formData.get("status") as string,
      interest: formData.get("interest") as string,
      counsellorConsent: requiredConsent,
      marketingConsent: marketingConsent,
      hp_company: (formData.get("hp_company") as string) || "",
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to submit. Please check your information.");
        return;
      }

      setSubmitted(true);
    } catch {
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <section
        id="contact"
        className="scroll-mt-24 bg-background py-14 sm:py-20 lg:py-24"
      >
        <div className="page-container">
          <div className="grid gap-8 sm:gap-12 lg:gap-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            {/* Left column */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              className="lg:sticky lg:top-28"
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Take your first step
              </p>

              <h2 className="mt-4 font-heading text-2xl font-bold tracking-tight text-foreground min-[375px]:text-3xl sm:text-4xl">
                Your next opportunity starts with one profile.
              </h2>

              <p className="mt-4 text-sm leading-7 text-secondary-text sm:mt-5 sm:text-base">
                Tell us a little about yourself. Start exploring career
                preparation and study opportunities with CareerEdge.
              </p>

              <motion.ul
                variants={listVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.5 }}
                className="mt-6 space-y-3 sm:mt-8 sm:space-y-4"
              >
                {checklist.map((text) => (
                  <motion.li
                    key={text}
                    variants={fadeUp}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2
                      className="shrink-0 text-success"
                      size={19}
                      aria-hidden="true"
                    />
                    <span className="text-sm text-secondary-text">{text}</span>
                  </motion.li>
                ))}
              </motion.ul>

              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-gold/40 bg-gold-soft/40 p-3.5 sm:mt-8 sm:p-4">
                <LockKeyhole
                  size={19}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-primary"
                />
                <p className="text-xs leading-5 text-secondary-text">
                  Your data is protected under India DPDP Act 2023 standards.
                  We use your details strictly to provide career guidance and
                  never share your personal contact without consent.
                </p>
              </div>
            </motion.div>

            {/* Form card */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              className="relative overflow-hidden rounded-3xl border border-border bg-white p-4 shadow-xl shadow-black/5 min-[375px]:p-6 sm:p-8"
            >
              {/* Accent line */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-gold to-primary"
              />

              <AnimatePresence mode="wait" initial={false}>
                {submitted ? (
                  <motion.div
                    key="success"
                    role="status"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="flex min-h-[320px] flex-col items-center justify-center text-center sm:min-h-[400px]"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 16,
                        delay: 0.15,
                      }}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-soft text-primary"
                    >
                      <CheckCircle2 size={32} aria-hidden="true" />
                    </motion.div>

                    <h3 className="mt-6 font-heading text-xl font-bold text-foreground sm:text-2xl">
                      Thank You! Request Received
                    </h3>

                    <p className="mt-3 max-w-sm text-sm leading-6 text-secondary-text">
                      Our career guidance advisors have received your inquiry and
                      will review your profile to prepare personalized recommendations.
                    </p>

                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="mt-6 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-primary transition hover:border-primary/40 hover:bg-background"
                    >
                      Submit another inquiry
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <div>
                      <h3 className="font-heading text-lg font-bold text-foreground sm:text-xl">
                        Start your CareerEdge journey
                      </h3>
                      <p className="mt-2 text-sm text-secondary-text">
                        Share a few details to get started.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:mt-7 sm:space-y-5">
                      {/* Anti-spam honeypot */}
                      <input
                        type="text"
                        name="hp_company"
                        tabIndex={-1}
                        autoComplete="off"
                        className="hidden"
                        aria-hidden="true"
                      />
                      <div>
                        <label htmlFor="lead-name" className={labelClass}>
                          Full name <span className="text-error">*</span>
                        </label>
                        <input
                          id="lead-name"
                          name="name"
                          type="text"
                          placeholder="Enter your full name"
                          autoComplete="name"
                          required
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label htmlFor="lead-mobile" className={labelClass}>
                          Mobile number <span className="text-error">*</span>
                        </label>

                        <div className="flex overflow-hidden rounded-xl border border-border bg-white transition hover:border-primary/40 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
                          <span className="flex items-center border-r border-border bg-surface-muted px-3 text-sm font-semibold text-foreground sm:px-4">
                            +91
                          </span>
                          <input
                            id="lead-mobile"
                            name="mobile"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel-national"
                            placeholder="10-digit mobile number"
                            pattern="[6-9][0-9]{9}"
                            title="Enter a valid 10-digit Indian mobile number."
                            required
                            className="min-w-0 flex-1 bg-white px-4 py-3 text-base outline-none placeholder:text-text-muted sm:text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="lead-email" className={labelClass}>
                          Email address <span className="text-error">*</span>
                        </label>
                        <input
                          id="lead-email"
                          name="email"
                          type="email"
                          placeholder="Enter your email address"
                          autoComplete="email"
                          required
                          className={inputClass}
                        />
                      </div>

                      <SelectField
                        id="lead-city"
                        name="city"
                        label="City"
                        placeholder="Select your city"
                        options={cities}
                      />

                      <SelectField
                        id="lead-status"
                        name="status"
                        label="Current status"
                        placeholder="Select your current status"
                        options={statuses}
                      />

                      <SelectField
                        id="lead-interest"
                        name="interest"
                        label="What are you interested in?"
                        placeholder="Select your interest"
                        options={interests}
                      />

                      <div className="space-y-4 border-t border-border pt-5">
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            name="requiredConsent"
                            checked={requiredConsent}
                            onChange={(event) =>
                              setRequiredConsent(event.target.checked)
                            }
                            required
                            className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[#7a0f1f]"
                          />
                          <span className="text-xs leading-5 text-secondary-text">
                            I agree to the processing of my information for the
                            purpose of responding to my enquiry, as described in
                            the Privacy Policy.{" "}
                            <span className="text-error">*</span>
                          </span>
                        </label>

                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            name="marketingConsent"
                            checked={marketingConsent}
                            onChange={(event) =>
                              setMarketingConsent(event.target.checked)
                            }
                            className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[#7a0f1f]"
                          />
                          <span className="text-xs leading-5 text-secondary-text">
                            I would also like to receive optional updates about
                            CareerEdge, career opportunities and events.
                          </span>
                        </label>
                      </div>

                      {errorMessage && (
                        <div className="rounded-xl border border-error/30 bg-error/10 p-3 text-xs font-semibold text-error">
                          {errorMessage}
                        </div>
                      )}

                      <motion.button
                        type="submit"
                        disabled={!requiredConsent || submitting}
                        initial="rest"
                        whileHover={requiredConsent && !submitting ? "hover" : undefined}
                        whileTap={requiredConsent && !submitting ? { scale: 0.98 } : undefined}
                        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-primary/20 transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:px-6"
                      >
                        {submitting ? "Submitting..." : "Get Started"}
                        <motion.span
                          variants={arrowVariants}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                          }}
                          className="inline-flex"
                        >
                          <ArrowRight size={17} aria-hidden="true" />
                        </motion.span>
                      </motion.button>

                      <p className="text-center text-xs leading-5 text-text-muted">
                        Required fields are marked with an asterisk. Optional
                        updates are separate from your enquiry consent.
                      </p>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}
