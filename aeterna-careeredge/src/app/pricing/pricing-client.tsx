"use client";

// src/app/pricing/pricing-client.tsx
// Transparent, modern Value-Based Pricing & Plans matching CareerEdge Brand System:
// Option A: 3 First-Class Plans (Career Starter, CareerEdge Pro, Placement Season Pass)
// - Primary maroon: #7A1A2B, Page background: #FDF6F3, Border: #F0DFDC, Gold: #F2B33D, Green: #1F8A5B
// - Rounded 24px cards, clear typography hierarchy, honest non-predatory value proposition.

import React, { useState, useEffect } from "react";
import { StudentLayout } from "@/components/layouts/student-layout";
import { HowItWorksPanel } from "@/components/guidance/how-it-works-panel";
import {
  ShieldCheck,
  Check,
  Sparkles,
  Info,
  CheckCircle2,
  Zap,
  ArrowRight,
  GraduationCap,
  Clock,
  HelpCircle,
  X,
} from "lucide-react";

interface PricingClientProps {
  studentName: string;
}

export function PricingClient({ studentName }: PricingClientProps) {
  const [currentPlan, setCurrentPlan] = useState<string>("FREE");
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/plans")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.currentPlan?.id) {
          setCurrentPlan(data.currentPlan.id);
        }
      })
      .catch((err) => console.error("Error loading plans:", err));
  }, []);

  const handleUpgrade = async (planId: "PREMIUM" | "PLACEMENT_PASS" | "FREE" = "PREMIUM", isDev = false) => {
    setUpgradingPlan(planId);
    try {
      if (planId === "FREE") {
        const res = await fetch("/api/billing/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: "FREE", isDevUpgrade: true }),
        });
        if (res.ok) {
          setCurrentPlan("FREE");
          setSuccessMessage("Switched to Career Starter Free plan.");
          setTimeout(() => setSuccessMessage(null), 5000);
        }
        return;
      }

      if (isDev) {
        // Developer instant testing bypass
        const res = await fetch("/api/billing/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId, isDevUpgrade: true }),
        });
        if (res.ok) {
          setCurrentPlan(planId);
          setSuccessMessage(
            `🎉 Successfully activated ${
              planId === "PREMIUM" ? "CareerEdge Pro" : "Placement Season Pass"
            }! All limits lifted.`
          );
          setTimeout(() => setSuccessMessage(null), 6000);
        }
        return;
      }

      // Step 1: Create Order from backend
      const orderRes = await fetch("/api/billing/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      if (!orderRes.ok) {
        throw new Error("Failed to create billing order");
      }

      const orderData = await orderRes.json();

      // Step 2: Open Razorpay Checkout modal if live credentials are configured
      if (orderData.isLive && orderData.keyId) {
        if (!(window as any).Razorpay) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve();
            script.onerror = () =>
              reject(new Error("Failed to load Razorpay checkout SDK"));
            document.body.appendChild(script);
          });
        }

        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: "Aeterna CareerEdge",
          description:
            planId === "PREMIUM"
              ? "CareerEdge Pro Monthly Subscription"
              : "Placement Season Pass (45 Days One-Time)",
          image: "/assets/logos/company-logo.webp",
          order_id: orderData.orderId,
          handler: async function (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) {
            // Step 3: Verify HMAC-SHA256 signature and activate subscription
            const verifyRes = await fetch("/api/billing/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                planId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (verifyRes.ok) {
              setCurrentPlan(planId);
              setSuccessMessage(
                `🎉 Payment verified! Successfully upgraded to ${
                  planId === "PREMIUM" ? "CareerEdge Pro" : "Placement Season Pass"
                }! All features unlocked.`
              );
              setTimeout(() => setSuccessMessage(null), 6000);
            }
          },
          prefill: {
            name: studentName,
          },
          theme: {
            color: "#7A1A2B",
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Fallback simulation when live keys are not yet provided
        const res = await fetch("/api/billing/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId, isDevUpgrade: true }),
        });
        if (res.ok) {
          setCurrentPlan(planId);
          setSuccessMessage(
            `🎉 Upgraded to ${
              planId === "PREMIUM" ? "CareerEdge Pro" : "Placement Season Pass"
            }! (Simulated order mode active).`
          );
          setTimeout(() => setSuccessMessage(null), 6000);
        }
      }
    } catch (err: any) {
      console.error("Upgrade error:", err);
      alert(err.message || "Payment process could not be initialized.");
    } finally {
      setUpgradingPlan(null);
    }
  };

  return (
    <StudentLayout userName={studentName}>
      <div className="min-h-screen bg-[#FDF6F3] p-4 sm:p-6 md:p-8 text-[#2A1417]">
        <div className="max-w-6xl mx-auto space-y-10 pb-16">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F9E8E8] text-[#7A1A2B] border border-[#F0DFDC] shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#F2B33D]" />
              Fair, Transparent Career Pricing
            </span>
            <h1 className="font-heading text-2.5xl sm:text-3xl md:text-4xl font-extrabold text-[#2A1417] tracking-tight">
              Honest Plans For Every Stage of Your Career Journey
            </h1>
            <p className="text-xs sm:text-sm text-[#6F5A5D] leading-relaxed max-w-2xl mx-auto">
              No hidden fees, no fake paywalls. Start free forever with your verified career baseline, or unlock deep role-tailored optimization and placement sprints when recruitment begins.
            </p>
          </div>

          {/* Guidance Helper */}
          <HowItWorksPanel toolKey="pricing" />

          {/* Success Alert */}
          {successMessage && (
            <div className="bg-[#EBF7F0] border border-[#1F8A5B]/30 text-[#1F8A5B] text-xs sm:text-sm px-5 py-3 rounded-2xl flex items-center gap-3 max-w-xl mx-auto shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-[#1F8A5B] shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {/* 3-Card Pricing Grid: Career Starter vs CareerEdge Pro vs Placement Season Pass */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Card 1: Free Starter */}
            <div className="relative overflow-hidden rounded-3xl border border-[#F0DFDC] bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#907D79] bg-[#FDF6F3] px-2.5 py-0.5 rounded-full border border-[#F0DFDC]">
                    Free Forever
                  </span>
                  {currentPlan === "FREE" && (
                    <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-[#EBF7F0] text-[#1F8A5B] border border-[#1F8A5B]/20">
                      Current Plan
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-heading text-xl sm:text-2xl font-extrabold text-[#2A1417]">
                    Career Starter
                  </h3>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-3xl sm:text-4xl font-black text-[#2A1417]">₹0</span>
                    <span className="text-xs text-[#6F5A5D] font-medium">/ forever</span>
                  </div>
                  <p className="text-xs text-[#6F5A5D] mt-2 leading-relaxed">
                    Essential baseline tools to map your profile, test ATS alignment, and organize your job hunt.
                  </p>
                </div>

                {/* Feature Checklist */}
                <ul className="space-y-3 pt-4 border-t border-[#F0DFDC] text-xs text-[#2A1417]">
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>Multi-Domain Student Career Profile</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>Secure Document Storage (up to 10 files)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>1 Profession-Specific Resume</strong> with direct PDF export</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>ATS Resume Check (3 checks/month)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>Application Journey Tracker</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>AI Career Guide (15 questions/month)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>Role-Fit & Job Match (15 matches/month)</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={currentPlan === "FREE"}
                  onClick={() => handleUpgrade("FREE")}
                  className="w-full py-3 px-4 rounded-full text-xs font-bold border border-[#F0DFDC] text-[#6F5A5D] bg-[#FFF9F7] hover:bg-[#F9E8E8] transition disabled:opacity-80 disabled:hover:bg-[#FFF9F7] cursor-pointer disabled:cursor-default"
                >
                  {currentPlan === "FREE" ? "Active Starter Plan" : "Downgrade to Free"}
                </button>
              </div>
            </div>

            {/* Card 2: CareerEdge Pro (Flagship) */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-[#7A1A2B] bg-white p-6 sm:p-7 shadow-card flex flex-col justify-between space-y-6">
              {/* Top Accent Ribbon */}
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-[#7A1A2B] via-[#F2B33D] to-[#7A1A2B]" />

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A1A2B] bg-[#F9E8E8] px-2.5 py-0.5 rounded-full border border-[#F0DFDC]">
                    Flagship Subscription
                  </span>
                  <span className="inline-flex items-center gap-1 bg-[#7A1A2B] text-[#F2B33D] text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-2xs">
                    <Zap size={11} className="fill-[#F2B33D]" />
                    Most Popular
                  </span>
                </div>

                <div>
                  <h3 className="font-heading text-xl sm:text-2xl font-extrabold text-[#2A1417]">
                    CareerEdge Pro
                  </h3>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-3xl sm:text-4xl font-black text-[#7A1A2B]">₹499</span>
                    <span className="text-xs text-[#6F5A5D] font-medium">/ month</span>
                  </div>
                  <p className="text-xs text-[#6F5A5D] mt-2 leading-relaxed">
                    Full optimization suite with unlimited resume versions, interview prep kits, and 30-day roadmap sprints.
                  </p>
                </div>

                {/* Feature Checklist */}
                <ul className="space-y-3 pt-4 border-t border-[#F0DFDC] text-xs text-[#2A1417]">
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>Unlimited Resumes</strong> with JD tailoring</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>Interview Prep Kits</strong> with STAR Q&amp;A (20/mo)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>30-Day Employability Sprints</strong> (5/mo)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>1-Click Application Packs</strong> (20/mo)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>Full LinkedIn Optimizer</strong> (headline &amp; polish)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>Expanded Storage</strong> (up to 50 verified files)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>AI Career Guide</strong> (150 questions/month)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>50 ATS Checks &amp; 100 Job Matches/mo</strong></span>
                  </li>
                </ul>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => handleUpgrade("PREMIUM", false)}
                  disabled={upgradingPlan !== null || currentPlan === "PREMIUM"}
                  className="w-full py-3.5 px-5 rounded-full text-xs font-extrabold bg-[#7A1A2B] text-white hover:bg-[#650B19] active:bg-[#4C0915] shadow-sm hover:shadow transition disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1A2B]"
                >
                  <Sparkles className="w-4 h-4 text-[#F2B33D]" />
                  <span>
                    {currentPlan === "PREMIUM"
                      ? "Current Active Plan"
                      : upgradingPlan === "PREMIUM"
                      ? "Processing..."
                      : "Upgrade to Pro (₹499/mo)"}
                  </span>
                  <ArrowRight size={13} className="text-white" />
                </button>

                {/* Dev Test Upgrade Button */}
                {currentPlan !== "PREMIUM" && (
                  <button
                    type="button"
                    onClick={() => handleUpgrade("PREMIUM", true)}
                    className="w-full py-2 px-3 text-[11px] font-semibold text-[#7A1A2B] bg-[#F9E8E8] hover:bg-[#F0DFDC] rounded-full border border-[#F0DFDC] transition"
                  >
                    ⚡ Dev Test Upgrade (Pro)
                  </button>
                )}
              </div>
            </div>

            {/* Card 3: Placement Season Pass */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-[#F2B33D]/60 bg-white p-6 sm:p-7 shadow-card flex flex-col justify-between space-y-6">
              {/* Top Accent Ribbon */}
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-[#F2B33D] via-[#7A1A2B] to-[#F2B33D]" />

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#2A1417] bg-[#FDF1D6] px-2.5 py-0.5 rounded-full border border-[#F2B33D]/40">
                    45-Day Fixed Pass
                  </span>
                  <span className="inline-flex items-center gap-1 bg-[#F2B33D] text-[#2A1417] text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-2xs">
                    <GraduationCap size={12} className="text-[#2A1417]" />
                    Campus Special
                  </span>
                </div>

                <div>
                  <h3 className="font-heading text-xl sm:text-2xl font-extrabold text-[#2A1417]">
                    Placement Pass
                  </h3>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-3xl sm:text-4xl font-black text-[#2A1417]">₹799</span>
                    <span className="text-xs text-[#6F5A5D] font-medium">/ 45 days (one-time)</span>
                  </div>
                  <p className="text-xs text-[#6F5A5D] mt-2 leading-relaxed">
                    Designed specifically for final-year students in placement season. Zero recurring charges or auto-debits.
                  </p>
                </div>

                {/* Feature Checklist */}
                <ul className="space-y-3 pt-4 border-t border-[#F0DFDC] text-xs text-[#2A1417]">
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>All Pro Features Unlocked</strong> for 45 calendar days</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>Unlimited Resumes</strong> &amp; JD customization</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>Expanded Interview Prep Kits</strong> (50 kits)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>Expanded Application Packs</strong> (50 packs)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>10 Employability Sprint Roadmaps</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>250 AI Guide Questions</strong> during drives</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>200 Job Matches &amp; Readiness Reports</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>One-Time Payment</strong> (No surprise auto-renewals)</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => handleUpgrade("PLACEMENT_PASS", false)}
                  disabled={upgradingPlan !== null || currentPlan === "PLACEMENT_PASS"}
                  className="w-full py-3.5 px-5 rounded-full text-xs font-extrabold bg-[#2A1417] text-white hover:bg-[#1D0E10] active:bg-[#000000] shadow-sm hover:shadow transition disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A1417]"
                >
                  <GraduationCap className="w-4 h-4 text-[#F2B33D]" />
                  <span>
                    {currentPlan === "PLACEMENT_PASS"
                      ? "Active Placement Pass"
                      : upgradingPlan === "PLACEMENT_PASS"
                      ? "Processing..."
                      : "Get 45-Day Pass (₹799)"}
                  </span>
                  <ArrowRight size={13} className="text-white" />
                </button>

                {/* Dev Test Upgrade Button */}
                {currentPlan !== "PLACEMENT_PASS" && (
                  <button
                    type="button"
                    onClick={() => handleUpgrade("PLACEMENT_PASS", true)}
                    className="w-full py-2 px-3 text-[11px] font-semibold text-[#2A1417] bg-[#FDF1D6] hover:bg-[#F2B33D]/30 rounded-full border border-[#F2B33D]/40 transition"
                  >
                    ⚡ Dev Test Upgrade (Pass)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Feature Comparison Table */}
          <div className="bg-white rounded-3xl border border-[#F0DFDC] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="space-y-1 text-center sm:text-left">
              <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-[#2A1417]">
                Compare Plan Inclusions
              </h2>
              <p className="text-xs text-[#6F5A5D]">
                Detailed feature breakdown and monthly quotas across all 3 tiers.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F0DFDC] text-[#6F5A5D]">
                    <th className="py-3 px-4 font-bold text-[#2A1417]">Feature</th>
                    <th className="py-3 px-4 font-bold text-center">Career Starter (₹0)</th>
                    <th className="py-3 px-4 font-bold text-center text-[#7A1A2B] bg-[#FDF6F3]">CareerEdge Pro (₹499/mo)</th>
                    <th className="py-3 px-4 font-bold text-center text-[#2A1417]">Placement Pass (₹799/45d)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0DFDC]/60 text-[#2A1417]">
                  <tr>
                    <td className="py-3 px-4 font-semibold">Resume Creation &amp; Versions</td>
                    <td className="py-3 px-4 text-center">1 Resume</td>
                    <td className="py-3 px-4 text-center font-bold text-[#7A1A2B] bg-[#FDF6F3]">Unlimited</td>
                    <td className="py-3 px-4 text-center font-bold">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">ATS Compatibility Checks</td>
                    <td className="py-3 px-4 text-center">3 / month</td>
                    <td className="py-3 px-4 text-center font-bold text-[#7A1A2B] bg-[#FDF6F3]">50 / month</td>
                    <td className="py-3 px-4 text-center font-bold">50 / pass</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">STAR Interview Prep Kits</td>
                    <td className="py-3 px-4 text-center text-[#907D79]">—</td>
                    <td className="py-3 px-4 text-center font-bold text-[#7A1A2B] bg-[#FDF6F3]">20 / month</td>
                    <td className="py-3 px-4 text-center font-bold">50 / pass</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">30-Day Employability Sprints</td>
                    <td className="py-3 px-4 text-center text-[#907D79]">—</td>
                    <td className="py-3 px-4 text-center font-bold text-[#7A1A2B] bg-[#FDF6F3]">5 / month</td>
                    <td className="py-3 px-4 text-center font-bold">10 / pass</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">1-Click Application Packs</td>
                    <td className="py-3 px-4 text-center text-[#907D79]">—</td>
                    <td className="py-3 px-4 text-center font-bold text-[#7A1A2B] bg-[#FDF6F3]">20 / month</td>
                    <td className="py-3 px-4 text-center font-bold">50 / pass</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">AI Career Guide Questions</td>
                    <td className="py-3 px-4 text-center">15 / month</td>
                    <td className="py-3 px-4 text-center font-bold text-[#7A1A2B] bg-[#FDF6F3]">150 / month</td>
                    <td className="py-3 px-4 text-center font-bold">250 / pass</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Role-Fit &amp; Job Matches</td>
                    <td className="py-3 px-4 text-center">15 / month</td>
                    <td className="py-3 px-4 text-center font-bold text-[#7A1A2B] bg-[#FDF6F3]">100 / month</td>
                    <td className="py-3 px-4 text-center font-bold">200 / pass</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Document Vault Storage</td>
                    <td className="py-3 px-4 text-center">Up to 10 files</td>
                    <td className="py-3 px-4 text-center font-bold text-[#7A1A2B] bg-[#FDF6F3]">Up to 50 files</td>
                    <td className="py-3 px-4 text-center font-bold">Up to 50 files</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Payment &amp; Commitment</td>
                    <td className="py-3 px-4 text-center">Free Forever</td>
                    <td className="py-3 px-4 text-center text-[#7A1A2B] bg-[#FDF6F3]">Monthly Subscription</td>
                    <td className="py-3 px-4 text-center">One-Time (No auto-debit)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Value Guarantee Note */}
          <div className="bg-white rounded-3xl border border-[#F0DFDC] p-6 sm:p-7 shadow-xs flex items-start gap-4 text-xs text-[#6F5A5D]">
            <Info className="w-5 h-5 text-[#7A1A2B] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-[#2A1417] font-bold block text-sm">
                The CareerEdge Promise
              </strong>
              <p className="leading-relaxed">
                We tell you honestly where you stand for your chosen career, and provide the exact steps to bridge skill gaps. We never sell your data, never scrape protected websites, and never fabricate credentials. Cancel subscriptions anytime with one click in account settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}