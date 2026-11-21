"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Rocket,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MotionConfig, motion, type Variants } from "motion/react";

const spring = { type: "spring", stiffness: 300, damping: 20 } as const;

const buttonVariants: Variants = {
  rest: { scale: 1, transition: spring },
  hover: { scale: 1.03, transition: spring },
  tap: { scale: 0.98, transition: spring },
};

const arrowVariants: Variants = {
  rest: { x: 0, transition: spring },
  hover: { x: 5, transition: spring },
};

const rocketVariants: Variants = {
  rest: { x: 0, y: 0, transition: spring },
  hover: { x: 3, y: -3, transition: spring },
};

const textVariants: Variants = {
  rest: { x: 0, transition: spring },
  hover: { x: 2, transition: spring },
};

const imageVariants: Variants = {
  rest: { scale: 1, transition: spring },
  hover: { scale: 1.06, transition: spring },
};

// Entrance animation: the hero content staggers in on page load
const contentVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const trustItems = [
  { icon: CheckCircle2, iconClass: "text-success", label: "Free to start" },
  {
    icon: ShieldCheck,
    iconClass: "text-success",
    label: "Your data stays private",
  },
  {
    icon: MapPin,
    iconClass: "text-primary",
    label: "Bengaluru · Mysuru · Belagavi",
  },
];

export function HeroSection() {
  return (
    <MotionConfig reducedMotion="user">
      <section className="relative isolate overflow-hidden bg-background">
        {/* Subtle background gradient */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-white via-background to-gold-soft/30"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(122,15,31,0.05),transparent_55%)]"
        />

        <div className="page-container grid items-center gap-10 py-12 sm:gap-12 sm:py-16 lg:min-h-[700px] lg:grid-cols-2 lg:gap-14 lg:py-10 xl:min-h-[760px] xl:gap-20">
          {/* Hero content */}
          <motion.div
            variants={contentVariants}
            initial="hidden"
            animate="show"
            className="relative z-10"
          >
            <motion.div variants={itemVariants}>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-primary shadow-sm sm:mb-6 sm:px-4 sm:py-2 sm:text-sm">
                <motion.span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full bg-gold"
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                Your future starts here
              </div>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="max-w-2xl font-heading text-[2rem] font-extrabold leading-[1.15] tracking-tight text-primary min-[375px]:text-4xl sm:text-5xl lg:text-6xl"
            >
              Build your career.
              <span className="mt-1 block text-primary">Study abroad.</span>
              <span className="mt-1 inline-block max-w-full text-foreground">
                <span>Get hired.</span>
                <Image
                  src="/assets/images/svgs/underline.svg"
                  width={120}
                  height={12}
                  alt=""
                  className="w-44 object-cover sm:w-56 lg:w-70 xl:w-80"
                />
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-5 max-w-xl text-sm leading-7 text-secondary-text sm:mt-7 sm:text-base sm:leading-8 lg:text-lg"
            >
              One profile. AI-powered resume, SOP, LinkedIn and career roadmap —
              made for students across India.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap"
            >
              <motion.div
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
              >
                <Link href="/signup">
                  <Button size="lg" fullWidth className="w-full px-4 text-sm sm:w-auto sm:px-6 sm:text-base">
                    Get Started Free
                    <motion.span
                      variants={arrowVariants}
                      className="inline-flex"
                    >
                      <ArrowRight size={18} />
                    </motion.span>
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
              >
                <Link href="#how-it-works">
                  <Button variant="outline" size="lg" fullWidth className="w-full px-4 text-sm sm:w-auto sm:px-6 sm:text-base">
                    <motion.span
                      variants={rocketVariants}
                      className="inline-flex"
                    >
                      <Rocket size={16} color="#6b0f1a" strokeWidth={1.5} />
                    </motion.span>
                    <motion.span variants={textVariants}>
                      See how it works
                    </motion.span>
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Trust indicators */}
            <motion.ul
              variants={itemVariants}
              className="mt-7 flex flex-wrap gap-x-3 gap-y-2 sm:mt-9 sm:gap-x-4 sm:gap-y-3"
            >
              {trustItems.map(({ icon: Icon, iconClass, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-2 rounded-full bg-[#FFF0EF]/80 px-3 py-1.5 text-xs text-secondary-text shadow-sm sm:px-4 sm:py-2 sm:text-sm"
                >
                  <Icon size={17} aria-hidden="true" className={iconClass} />
                  {label}
                </li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
            className="hidden lg:block mx-auto w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[472px] xl:max-w-[520px]"
          >
            <motion.div initial="rest" whileHover="hover" className="relative">
              <div className="absolute -right-4 -top-4 h-48 w-48 rounded-full bg-gold-soft/70 blur-3xl sm:-right-8 sm:-top-8 sm:h-64 sm:w-64" />

              {/* Image box: overflow-hidden stays here, with nothing else inside */}
              <div className="relative h-[300px] w-full overflow-hidden rounded-3xl shadow-xl sm:h-[380px] lg:h-[460px] xl:h-[500px]">
                <motion.div
                  variants={imageVariants}
                  className="absolute inset-0"
                >
                  <Image
                    src="/assets/images/hero-section/group-friends.webp"
                    alt="Indian college students collaborating on their career goals"
                    fill
                    priority
                    sizes="(max-width: 639px) 340px, (max-width: 1023px) 400px, (max-width: 1279px) 472px, 520px"
                    className="object-cover"
                  />
                </motion.div>
              </div>

              {/* Card: sibling of the image box, so it can overlap the corner without being clipped.
                  Floats gently up and down. */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -bottom-10 left-1/2 w-[calc(100%-1rem)] max-w-[340px] -translate-x-1/2 rounded-2xl bg-white p-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/5 sm:-left-10 sm:w-[380px] sm:max-w-none sm:translate-x-0 sm:p-4 lg:-left-12"
              >
                {/* Top row */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                    <Image
                      src="/assets/images/avatar/anuj.webp"
                      alt="Anuj Dandavate"
                      width={44}
                      height={44}
                      className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white sm:h-11 sm:w-11"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-heading text-base font-bold leading-tight text-foreground sm:text-lg">
                        Anuj Dandavate
                      </p>
                      <p className="truncate text-xs text-secondary-text sm:text-sm">
                        VTU Belagavi • CSE &apos;25
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-950 sm:self-auto sm:px-3 sm:py-1.5 sm:text-xs">
                    <Star size={14} strokeWidth={2} aria-hidden="true" />
                    KSSF Verified
                  </span>
                </div>

                <div className="my-3 h-px bg-black/5 sm:my-3.5" />

                {/* Passport strength */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-amber-950 sm:h-11 sm:w-11 sm:text-sm">
                      72%
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground sm:text-sm">
                        Passport Strength
                      </p>
                      <p className="truncate text-xs text-secondary-text sm:text-sm">
                        Top 8% ready for Bengaluru drives
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 self-start rounded-md bg-red-100 px-2 py-1 text-[10px] font-bold text-red-700 sm:self-auto sm:px-2.5 sm:text-xs">
                    96% Match
                  </span>
                </div>

                {/* Bottom strip */}
                <div className="mt-3.5 flex flex-col gap-2 rounded-xl bg-red-50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-3.5">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-red-950 sm:text-xs">
                    <CheckCircle2
                      size={15}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    SOP &amp; ATS Resume Ready
                  </div>
                  <button
                    type="button"
                    className="self-start text-[11px] font-bold text-rose-900 transition-colors hover:text-rose-700 sm:self-auto sm:text-xs"
                  >
                    Preview →
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Skyline sits behind the content */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-6 left-1/2 -z-10 -translate-x-1/2 sm:-bottom-8 lg:-bottom-11"
        >
          <Image
            src="/assets/images/hero-section/Buildings-removebg-preview.webp"
            alt=""
            width={1000}
            height={600}
            className="h-28 w-auto max-w-[85vw] object-contain sm:h-36 lg:h-45 lg:max-w-none"
          />
        </div>
      </section>
    </MotionConfig>
  );
}
