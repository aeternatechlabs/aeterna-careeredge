"use client";

// src/app/pricing/pricing-client.tsx
// Transparent, modern Value-Based Pricing & Plans matching CareerEdge Brand System:
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
} from "lucide-react";

interface PricingClientProps {
  studentName: string;
}

export function PricingClient({ studentName }: PricingClientProps) {
  const [currentPlan, setCurrentPlan] = useState<string>("FREE");
  const [upgrading, setUpgrading] = useState(false);
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

  const handleUpgrade = async (planId = "PREMIUM", isDev = false) => {
    setUpgrading(true);
    try {
      if (isDev) {
        // Fast Developer instant testing bypass
        const res = await fetch("/api/billing/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId, isDevUpgrade: true }),
        });
        if (res.ok) {
          setCurrentPlan(planId);
          setSuccessMessage(
            `🎉 Successfully upgraded to ${
              planId === "PREMIUM" ? "CareerEdge Pro" : "Placement Season Pass"
            }! All features unlocked.`
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
              ? "CareerEdge Pro Subscription"
              : "Placement Season Pass (45 Days)",
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
                }! All limits lifted.`
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
      setUpgrading(false);
    }
  };

  return (
    <StudentLayout userName={studentName}>
      <div className="min-h-screen bg-[#FDF6F3] p-4 sm:p-6 md:p-8 text-[#2A1417]">
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F9E8E8] text-[#7A1A2B] border border-[#F0DFDC] shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#F2B33D]" />
              Fair, Value-Proof Pricing
            </span>
            <h1 className="font-heading text-2.5xl sm:text-3xl md:text-4xl font-extrabold text-[#2A1417] tracking-tight">
              Simple, Transparent Plans For Every Career Stage
            </h1>
            <p className="text-xs sm:text-sm text-[#6F5A5D] leading-relaxed max-w-xl mx-auto">
              No dark patterns. No false promises. Free forever for baseline readiness, or upgrade when you need deep role-tailored optimization and placement sprints.
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

          {/* Plan Cards Grid: Free Starter vs CareerEdge Pro */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
            {/* Card 1: Free Starter */}
            <div className="relative overflow-hidden rounded-3xl border border-[#F0DFDC] bg-white p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#907D79]">
                    Free Forever
                  </span>
                  {currentPlan === "FREE" && (
                    <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-[#EBF7F0] text-[#1F8A5B] border border-[#1F8A5B]/20">
                      Current Plan
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-heading text-2xl font-extrabold text-[#2A1417]">
                    Career Starter
                  </h3>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-4xl font-black text-[#2A1417]">₹0</span>
                    <span className="text-xs text-[#6F5A5D] font-medium">/ forever</span>
                  </div>
                  <p className="text-xs text-[#6F5A5D] mt-2 leading-relaxed">
                    Essential tools to build your authentic career profile, baseline ATS resume, and track job applications.
                  </p>
                </div>

                {/* Feature Checklist */}
                <ul className="space-y-3 pt-4 border-t border-[#F0DFDC] text-xs text-[#2A1417]">
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>Comprehensive Multi-Domain Student Profile</span>
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
                    <span>1 Profession-Specific Resume with direct PDF export</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>Resume Studio ATS Compatibility Check</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>Full Application Journey Tracker</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>AI Career Guide (15 questions/month)</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={currentPlan === "FREE"}
                  className="w-full py-3 px-4 rounded-full text-xs font-bold border border-[#F0DFDC] text-[#6F5A5D] bg-[#FFF9F7] disabled:opacity-80 cursor-default"
                >
                  {currentPlan === "FREE" ? "Active Starter Plan" : "Downgrade to Free"}
                </button>
              </div>
            </div>

            {/* Card 2: CareerEdge Pro */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-[#7A1A2B] bg-white p-6 sm:p-8 shadow-card flex flex-col justify-between space-y-6">
              {/* Top Accent Ribbon */}
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-[#7A1A2B] via-[#F2B33D] to-[#7A1A2B]" />

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7A1A2B]">
                    Complete Career Suite
                  </span>
                  <span className="inline-flex items-center gap-1 bg-[#7A1A2B] text-[#F2B33D] text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-2xs">
                    <Zap size={11} className="fill-[#F2B33D]" />
                    Recommended
                  </span>
                </div>

                <div>
                  <h3 className="font-heading text-2xl font-extrabold text-[#2A1417]">
                    CareerEdge Pro
                  </h3>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-4xl font-black text-[#7A1A2B]">₹499</span>
                    <span className="text-xs text-[#6F5A5D] font-medium">/ month</span>
                  </div>
                  <p className="text-xs text-[#6F5A5D] mt-2 leading-relaxed">
                    Tailored application packs, 30-day employability sprints, interview kits, and unlimited resume versions.
                  </p>
                </div>

                {/* Feature Checklist */}
                <ul className="space-y-3 pt-4 border-t border-[#F0DFDC] text-xs text-[#2A1417]">
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>Unlimited Resumes</strong> with Job Description tailoring</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>Role-Specific Interview Prep Kits</strong> with STAR Q&amp;A</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>30-Day Employability Sprints</strong> with daily milestones</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>1-Click Application Packs</strong> (Cover notes &amp; talking points)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EBF7F0] text-[#1F8A5B] mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>Full LinkedIn Optimizer</strong> (Headline, summary &amp; experience)</span>
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
                </ul>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => handleUpgrade("PREMIUM", false)}
                  disabled={upgrading || currentPlan === "PREMIUM"}
                  className="w-full py-3.5 px-5 rounded-full text-xs font-extrabold bg-[#7A1A2B] text-white hover:bg-[#650B19] active:bg-[#4C0915] shadow-sm hover:shadow transition disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1A2B]"
                >
                  <Sparkles className="w-4 h-4 text-[#F2B33D]" />
                  <span>
                    {currentPlan === "PREMIUM"
                      ? "Current Active Plan"
                      : upgrading
                      ? "Processing..."
                      : "Upgrade to CareerEdge Pro"}
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
                    ⚡ Developer Instant Test Upgrade (Dev Mode)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Placement Season Pass Callout Card */}
          <div className="max-w-4xl mx-auto rounded-2xl sm:rounded-3xl border border-[#F0DFDC] bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F2B33D]/20 text-[#2A1417] border border-[#F2B33D]/40">
                  Campus Special
                </span>
                <h4 className="font-heading text-base font-bold text-[#2A1417]">
                  Placement Season Pass (45 Days)
                </h4>
              </div>
              <p className="text-xs text-[#6F5A5D] leading-relaxed">
                Fixed-window premium access for the duration of campus placement season. Unlimited resumes, application packs, and interview prep kits.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right sm:text-left">
                <span className="text-2xl font-black text-[#7A1A2B]">₹799</span>
                <span className="text-[11px] text-[#6F5A5D] block">one-time</span>
              </div>
              <button
                type="button"
                onClick={() => handleUpgrade("PLACEMENT_PASS", false)}
                disabled={upgrading || currentPlan === "PLACEMENT_PASS"}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#7A1A2B] px-5 py-2 text-xs font-bold text-white hover:bg-[#650B19] transition shadow-xs disabled:opacity-50"
              >
                <span>{currentPlan === "PLACEMENT_PASS" ? "Current Pass" : "Get Pass"}</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* Value Guarantee Note */}
          <div className="bg-white rounded-2xl border border-[#F0DFDC] p-5 sm:p-6 max-w-4xl mx-auto flex items-start gap-3.5 text-xs text-[#6F5A5D] shadow-xs">
            <Info className="w-5 h-5 text-[#7A1A2B] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-[#2A1417] font-bold block text-sm">
                The CareerEdge Promise
              </strong>
              <p className="leading-relaxed">
                We tell you honestly where you stand for your chosen career, and provide the exact steps to bridge skill gaps. We never sell your data, never scrape protected websites, and never fabricate credentials.
              </p>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
