"use client";

import React, { useState, FormEvent } from "react";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";

export function ContactFormClient() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Billing & Payments");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Simulate quick feedback submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-3xl border border-[#F0DFDC] p-8 sm:p-10 shadow-xs text-center space-y-4">
        <div className="w-12 h-12 bg-[#EBF7F0] text-[#1F8A5B] rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={24} />
        </div>
        <h3 className="font-heading text-xl font-bold text-[#2A1417]">
          Message Received!
        </h3>
        <p className="text-xs sm:text-sm text-[#6F5A5D] max-w-md mx-auto leading-relaxed">
          Thank you for reaching out, <strong>{name}</strong>. A member of our support team will respond to <strong>{email}</strong> within 1 business day.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setName("");
            setEmail("");
            setMessage("");
          }}
          className="mt-2 text-xs font-bold text-[#7A1A2B] hover:underline cursor-pointer"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-[#F0DFDC] p-6 sm:p-8 shadow-xs">
      <h2 className="font-heading text-lg font-bold text-[#2A1417] mb-5">
        Send Us a Message
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label htmlFor="name" className="block font-semibold text-[#2A1417] mb-1.5">
            Your Full Name *
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ananya Sharma"
            className="w-full rounded-xl border border-[#F0DFDC] bg-[#FFF9F7] px-3.5 py-2.5 text-[#2A1417] placeholder-[#907D79] focus:border-[#7A1A2B] focus:bg-white focus:outline-none transition"
          />
        </div>

        <div>
          <label htmlFor="email" className="block font-semibold text-[#2A1417] mb-1.5">
            Your Email Address *
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. ananya@gmail.com"
            className="w-full rounded-xl border border-[#F0DFDC] bg-[#FFF9F7] px-3.5 py-2.5 text-[#2A1417] placeholder-[#907D79] focus:border-[#7A1A2B] focus:bg-white focus:outline-none transition"
          />
        </div>

        <div>
          <label htmlFor="subject" className="block font-semibold text-[#2A1417] mb-1.5">
            Subject / Query Category *
          </label>
          <select
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-xl border border-[#F0DFDC] bg-[#FFF9F7] px-3.5 py-2.5 text-[#2A1417] focus:border-[#7A1A2B] focus:bg-white focus:outline-none transition"
          >
            <option value="Billing & Payments">Billing, Invoices &amp; Razorpay Payments</option>
            <option value="Placement Season Pass">Placement Season Pass Inquiries</option>
            <option value="College / Institutional Partnership">College &amp; University Partnerships</option>
            <option value="Technical Support">Technical &amp; Account Support</option>
            <option value="Other">General Feedback / Inquiries</option>
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block font-semibold text-[#2A1417] mb-1.5">
            Your Message *
          </label>
          <textarea
            id="message"
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Please describe your question or issue in detail..."
            className="w-full rounded-xl border border-[#F0DFDC] bg-[#FFF9F7] px-3.5 py-2.5 text-[#2A1417] placeholder-[#907D79] focus:border-[#7A1A2B] focus:bg-white focus:outline-none transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-5 rounded-full text-xs font-bold bg-[#7A1A2B] text-white hover:bg-[#650B19] active:bg-[#4C0915] shadow-sm hover:shadow transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Send size={13} className="text-white" />
          <span>{loading ? "Sending..." : "Submit Message"}</span>
        </button>
      </form>
    </div>
  );
}
