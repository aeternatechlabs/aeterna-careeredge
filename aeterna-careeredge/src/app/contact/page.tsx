import type { Metadata } from "next";
import { Mail, Phone, MapPin, Clock, ShieldCheck, MessageSquare, Building2, Send } from "lucide-react";
import { MarketingLayout } from "@/components/layouts/marketing-layout";
import { ContactFormClient } from "./contact-form-client";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Aeterna CareerEdge. Support, institutional partnerships, billing inquiries, and office locations.",
};

export default function ContactPage() {
  return (
    <MarketingLayout>
      <div className="bg-[#FFF8F6] py-12 sm:py-16">
        <div className="page-container max-w-5xl">
          {/* Header */}
          <div className="mb-12 text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F9E8E8] text-[#7A1A2B] border border-[#F0DFDC] shadow-2xs">
              <MessageSquare className="w-3.5 h-3.5 text-[#F2B33D]" />
              We Are Here to Help
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#2A1417] tracking-tight">
              Get in Touch with CareerEdge
            </h1>
            <p className="text-xs sm:text-sm text-[#6F5A5D] leading-relaxed">
              Have questions regarding our subscriptions, college placement partnerships, or need assistance with your student account? Our dedicated support team is available to assist you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Contact Details Column */}
            <div className="lg:col-span-5 space-y-6">
              {/* Direct Info Card */}
              <div className="bg-white rounded-3xl border border-[#F0DFDC] p-6 sm:p-7 shadow-xs space-y-6">
                <h2 className="font-heading text-lg font-bold text-[#2A1417]">
                  Contact Information
                </h2>

                <div className="space-y-5 text-xs text-[#554040]">
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-2xl bg-[#F9E8E8] text-[#7A1A2B] flex items-center justify-center shrink-0">
                      <Mail size={16} />
                    </div>
                    <div>
                      <strong className="block text-[#2A1417] font-semibold text-sm">Customer Support & Billing</strong>
                      <a href="mailto:support@aeternastudyabroad.com" className="text-[#7A1A2B] hover:underline block mt-0.5">
                        support@aeternastudyabroad.com
                      </a>
                      <a href="mailto:info@aeternatechlabs.com" className="text-[#6F5A5D] hover:underline block">
                        info@aeternatechlabs.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-2xl bg-[#F9E8E8] text-[#7A1A2B] flex items-center justify-center shrink-0">
                      <Phone size={16} />
                    </div>
                    <div>
                      <strong className="block text-[#2A1417] font-semibold text-sm">Phone Support</strong>
                      <a href="tel:+919886109955" className="text-[#7A1A2B] font-medium block mt-0.5">
                        +91 98861 09955
                      </a>
                      <span className="text-[11px] text-[#6F5A5D] block mt-0.5">
                        Monday – Saturday, 9:30 AM to 6:30 PM IST
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-2xl bg-[#F9E8E8] text-[#7A1A2B] flex items-center justify-center shrink-0">
                      <Building2 size={16} />
                    </div>
                    <div>
                      <strong className="block text-[#2A1417] font-semibold text-sm">Operating Entity</strong>
                      <p className="mt-0.5 text-[#6F5A5D]">
                        Aeterna Study Abroad / Atraena Tech Labs
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-2xl bg-[#F9E8E8] text-[#7A1A2B] flex items-center justify-center shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <strong className="block text-[#2A1417] font-semibold text-sm">Office Locations</strong>
                      <p className="mt-0.5 text-[#6F5A5D]">
                        Bengaluru · Mysuru · Belagavi
                        <br />
                        Karnataka, India
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="bg-[#EBF7F0] border border-[#1F8A5B]/20 rounded-2xl p-5 text-xs text-[#1F8A5B] flex items-start gap-3 shadow-2xs">
                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block text-sm">Official Merchant Support</strong>
                  <p className="mt-1 leading-relaxed text-[#145C3D]">
                    All transactions on CareerEdge are processed securely through Razorpay with 256-bit encryption and RBI-mandated compliance.
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Form Column */}
            <div className="lg:col-span-7">
              <ContactFormClient />
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
