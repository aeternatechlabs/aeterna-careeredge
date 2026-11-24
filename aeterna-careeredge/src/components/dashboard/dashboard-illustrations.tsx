"use client";

// src/components/dashboard/dashboard-illustrations.tsx
// Exact inline SVGs crafted to match the Aeterna CareerEdge reference mockups:
// Maroon (#7A1A2B / #8F2538), Soft Pink (#F9E8E8 / #FCE8EC), Gold (#F2B33D), Success Green (#1F8A5B).

import React from "react";

/**
 * Slide 1: Resume Studio
 * Angled/tilted resume document with maroon text lines, photo slot,
 * and a floating 4-point gold sparkle star near top-right.
 */
export function ResumeStudioIllustration({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      {/* Background shadow sheet (slightly tilted) */}
      <rect
        x="22"
        y="14"
        width="52"
        height="68"
        rx="7"
        fill="#FCE8EC"
        opacity="0.8"
        transform="rotate(-4 48 48)"
      />
      {/* Main white resume card */}
      <rect x="25" y="14" width="50" height="68" rx="7" fill="#FFFFFF" stroke="#8F2538" strokeWidth="2" />
      {/* Photo/avatar placeholder */}
      <rect x="32" y="21" width="10" height="10" rx="3" fill="#FCE8EC" stroke="#8F2538" strokeWidth="1" />
      {/* Document header lines */}
      <rect x="46" y="22" width="18" height="3" rx="1.5" fill="#8F2538" />
      <rect x="46" y="27" width="14" height="2" rx="1" fill="#D4A7AF" />
      {/* Divider */}
      <line x1="32" y1="36" x2="68" y2="36" stroke="#F0DFDC" strokeWidth="1.2" strokeDasharray="2 2" />
      {/* Section 1 lines */}
      <rect x="32" y="41" width="36" height="2" rx="1" fill="#8F2538" />
      <rect x="32" y="46" width="32" height="2" rx="1" fill="#D4A7AF" />
      <rect x="32" y="51" width="28" height="2" rx="1" fill="#D4A7AF" />
      {/* Section 2 lines */}
      <rect x="32" y="58" width="36" height="2" rx="1" fill="#8F2538" />
      <rect x="32" y="63" width="30" height="2" rx="1" fill="#D4A7AF" />
      <rect x="32" y="68" width="24" height="2" rx="1" fill="#D4A7AF" />
      {/* 4-point gold sparkle star floating near top-right */}
      <path
        d="M74 13L75.6 18.4L81 20L75.6 21.6L74 27L72.4 21.6L67 20L72.4 18.4L74 13Z"
        fill="#F2B33D"
      />
      {/* Mini accent sparkle */}
      <path
        d="M20 32L20.8 34.5L23 35.2L20.8 36L20 38.5L19.2 36L17 35.2L19.2 34.5L20 32Z"
        fill="#8F2538"
        opacity="0.6"
      />
    </svg>
  );
}

/**
 * Slide 2: Resume ATS Checker
 * Document sheet with horizontal text lines and an overlapping solid maroon
 * circle with a bold white checkmark at the bottom-right corner.
 */
export function ATSCheckerIllustration({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      {/* Soft background shadow sheet */}
      <rect x="18" y="16" width="50" height="66" rx="7" fill="#FCE8EC" opacity="0.7" />
      {/* Main document card */}
      <rect x="22" y="14" width="50" height="66" rx="7" fill="#FFFFFF" stroke="#8F2538" strokeWidth="2" />
      {/* Document header lines */}
      <rect x="29" y="24" width="20" height="3" rx="1.5" fill="#8F2538" />
      <rect x="29" y="30" width="32" height="2" rx="1" fill="#D4A7AF" />
      {/* Body text lines */}
      <rect x="29" y="38" width="36" height="2" rx="1" fill="#8F2538" />
      <rect x="29" y="43" width="30" height="2" rx="1" fill="#D4A7AF" />
      <rect x="29" y="48" width="34" height="2" rx="1" fill="#D4A7AF" />
      {/* Section 2 */}
      <rect x="29" y="55" width="22" height="2" rx="1" fill="#8F2538" />
      <rect x="29" y="60" width="18" height="2" rx="1" fill="#D4A7AF" />
      <rect x="29" y="65" width="20" height="2" rx="1" fill="#D4A7AF" />
      {/* Solid Maroon Badge with White Checkmark overlapping bottom right */}
      <circle cx="68" cy="68" r="14" fill="#8F2538" />
      <path
        d="M62 68.5L66 72.5L74 63.5"
        stroke="#FFFFFF"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Slide 3: LinkedIn Optimizer
 * Rounded square with thick maroon border containing the bold lowercase "in" logo,
 * with a dynamic growth/trending arrow swooshing up to the top-right.
 */
export function LinkedInIllustration({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      {/* Swooshing Growth Trend Arrow */}
      <path
        d="M18 74C26 74 34 70 42 60C50 50 56 42 76 32"
        stroke="#8F2538"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M66 30H78V42"
        stroke="#8F2538"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* LinkedIn "in" rounded badge */}
      <rect x="28" y="24" width="46" height="46" rx="10" fill="#FFFFFF" stroke="#8F2538" strokeWidth="2.5" />
      {/* Lowercase "in" typography */}
      <text
        x="51"
        y="56"
        fill="#8F2538"
        fontSize="28"
        fontWeight="bold"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        textAnchor="middle"
      >
        in
      </text>
      {/* Small gold sparkle star accent */}
      <path
        d="M78 17L79 20.5L82.5 21.5L79 22.5L78 26L77 22.5L73.5 21.5L77 20.5L78 17Z"
        fill="#F2B33D"
      />
    </svg>
  );
}

/**
 * Slide 4: Job Match
 * Clean maroon briefcase with gold accents and match indicator.
 */
export function JobMatchIllustration({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      {/* Soft background halo */}
      <circle cx="50" cy="50" r="32" fill="#FCE8EC" opacity="0.6" />
      {/* Briefcase */}
      <rect x="26" y="36" width="48" height="34" rx="6" fill="#8F2538" />
      {/* Handle */}
      <path
        d="M38 36V30C38 28.3431 39.3431 27 41 27H59C60.6569 27 62 28.3431 62 30V36"
        stroke="#8F2538"
        strokeWidth="3"
      />
      {/* Horizontal accent line */}
      <path d="M26 48H74" stroke="#650B19" strokeWidth="2" />
      {/* Gold clasp */}
      <rect x="46" y="45" width="8" height="6" rx="1.5" fill="#F2B33D" />
      {/* Solid green check badge */}
      <circle cx="68" cy="30" r="9" fill="#1F8A5B" />
      <path d="M64 30L67 33L72 27" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Slide 5: 30-Day Sprint
 * Calendar card with date grid dots and a vibrant gold lightning bolt overlapping.
 */
export function SprintIllustration({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      {/* Calendar body */}
      <rect x="22" y="20" width="56" height="58" rx="8" fill="#FFFFFF" stroke="#8F2538" strokeWidth="2" />
      {/* Top maroon header bar */}
      <path d="M22 28C22 24.134 25.134 21 29 21H71C74.866 21 78 24.134 78 28V34H22V28Z" fill="#8F2538" />
      {/* Rings */}
      <rect x="34" y="16" width="4" height="7" rx="1.5" fill="#F2B33D" />
      <rect x="62" y="16" width="4" height="7" rx="1.5" fill="#F2B33D" />
      {/* Grid dots */}
      <circle cx="35" cy="44" r="2.5" fill="#8F2538" opacity="0.7" />
      <circle cx="50" cy="44" r="2.5" fill="#8F2538" opacity="0.7" />
      <circle cx="65" cy="44" r="2.5" fill="#8F2538" opacity="0.7" />
      <circle cx="35" cy="54" r="2.5" fill="#8F2538" opacity="0.7" />
      <circle cx="50" cy="54" r="2.5" fill="#8F2538" opacity="0.7" />
      <circle cx="65" cy="54" r="2.5" fill="#8F2538" opacity="0.7" />
      <circle cx="35" cy="64" r="2.5" fill="#8F2538" opacity="0.7" />
      <circle cx="50" cy="64" r="2.5" fill="#8F2538" opacity="0.7" />
      {/* Gold lightning bolt badge */}
      <g transform="translate(60, 52)">
        <circle cx="12" cy="12" r="11" fill="#FFF2D6" stroke="#F2B33D" strokeWidth="1.5" />
        <path d="M13 5L8 13H13L11 19L17 11H12L13 5Z" fill="#F2B33D" />
      </g>
    </svg>
  );
}

/**
 * Cloud Upload Illustration for "Your files"
 */
export function CloudUploadIllustration({ className = "w-14 h-14" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect x="4" y="4" width="56" height="56" rx="28" fill="#F9E8E8" opacity="0.6" />
      <path
        d="M44 34C46.2091 34 48 32.2091 48 30C48 27.9405 46.4455 26.2449 44.4447 26.0272C43.9536 21.5283 40.1613 18 35.5 18C31.5283 18 28.1882 20.5739 27.0506 24.1812C24.2384 24.6468 22 27.1009 22 30.0833C22 33.351 24.649 36 27.9167 36H44"
        stroke="#7A1A2B"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 46V28M32 28L26 34M32 28L38 34"
        stroke="#7A1A2B"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Do This Next Banner Illustration
 */
export function NextActionIllustration({ className = "w-14 h-14" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect x="6" y="6" width="48" height="48" rx="14" fill="#FFFFFF" fillOpacity="0.16" />
      <rect x="14" y="12" width="28" height="36" rx="5" fill="#FFFFFF" />
      <rect x="18" y="18" width="12" height="3" rx="1.5" fill="#7A1A2B" />
      <rect x="18" y="24" width="20" height="2" rx="1" fill="#E8D2CE" />
      <rect x="18" y="29" width="16" height="2" rx="1" fill="#E8D2CE" />
      <rect x="18" y="34" width="18" height="2" rx="1" fill="#E8D2CE" />
      <circle cx="38" cy="40" r="9" fill="#1F8A5B" stroke="#FFFFFF" strokeWidth="2" />
      <path d="M35 40L37.5 42.5L41.5 37.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Gold Active Circular Icon for Step 3 in Stepper
 * Circular icon with gold rotating/curved progress arrows matching the reference mockup.
 */
export function StepperActiveGoldIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <circle cx="14" cy="14" r="13" stroke="#F2B33D" strokeWidth="2" fill="#FFFFFF" />
      <path
        d="M14 6C18.4183 6 22 9.58172 22 14C22 15.6558 21.4962 17.1941 20.6335 18.4682"
        stroke="#F2B33D"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M14 22C9.58172 22 6 18.4183 6 14C6 12.3442 6.5038 10.8059 7.36647 9.53177"
        stroke="#F2B33D"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="14" cy="14" r="3" fill="#F2B33D" />
    </svg>
  );
}
