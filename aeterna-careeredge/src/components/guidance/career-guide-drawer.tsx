"use client";

// src/components/guidance/career-guide-drawer.tsx
// AI Career Guide Interactive Drawer (Day 2 Section D)
// Always knows current page context; offers 3 static questions (0 AI cost); provides citations and deep-link actions.

import { useState, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bot,
  X,
  Send,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Loader2,
  Lock,
} from "lucide-react";
import { PAGE_SUGGESTED_QUESTIONS } from "@/content/guide/en";

interface ChatMessage {
  id: string;
  sender: "STUDENT" | "GUIDE";
  text: string;
  actionRoute?: string;
  actionLabel?: string;
  citations?: string[];
  isAiGenerated?: boolean;
}

interface CareerGuideDrawerProps {
  studentDomain?: string;
  targetRole?: string;
}

export function CareerGuideDrawer({
  studentDomain = "Multi-Domain",
  targetRole,
}: CareerGuideDrawerProps) {
  const pathname = usePathname();
  const counterRef = useRef(0);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-welcome",
      sender: "GUIDE",
      text: `Hello! I am your Career Guide. I know you are in ${studentDomain}${targetRole ? ` aiming for ${targetRole}` : ""}. How can I help you today?`,
      citations: ["Career Passport Verified Context"],
    },
  ]);
  const [errorNote, setErrorNote] = useState<string | null>(null);

  // Suggested questions for current path
  const suggested =
    PAGE_SUGGESTED_QUESTIONS[pathname] || PAGE_SUGGESTED_QUESTIONS["/dashboard"];

  async function handleSend(textToSend?: string) {
    const q = (textToSend || input).trim();
    if (!q || loading) return;

    setErrorNote(null);
    setInput("");

    counterRef.current += 1;
    // Append student message
    const userMsg: ChatMessage = {
      id: `usr-${counterRef.current}`,
      sender: "STUDENT",
      text: q,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/guide/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, currentPath: pathname }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.quotaExhausted) {
          setErrorNote(data.error);
        } else {
          setErrorNote(data.error || "Could not answer right now.");
        }
        return;
      }

      counterRef.current += 1;
      const guideMsg: ChatMessage = {
        id: `guide-${counterRef.current}`,
        sender: "GUIDE",
        text: data.answer,
        actionRoute: data.actionRoute,
        actionLabel: data.nextBestStep || "Take Next Step",
        citations: data.citations,
        isAiGenerated: data.isAiGenerated,
      };

      setMessages((prev) => [...prev, guideMsg]);
    } catch {
      setErrorNote("Network error occurred. Please check connection.");
    } finally {
      setLoading(false);
    }
  }

  function handleClearHistory() {
    setMessages([
      {
        id: "initial-reset",
        sender: "GUIDE",
        text: `Conversation cleared. What would you like to explore next?`,
      },
    ]);
    setErrorNote(null);
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Career Guide"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-[#7A0F1F] hover:bg-[#650B19] px-4 py-3 text-white shadow-xl shadow-[#7A0F1F]/25 transition-all hover:scale-105 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2B63D]"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F2B63D] text-[#2B1B1B] font-bold">
          <Bot size={16} strokeWidth={2.2} />
        </div>
        <span className="text-xs font-bold tracking-wide">Career Guide</span>
        <span className="flex h-2 w-2 rounded-full bg-[#F2B63D] animate-pulse" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close Career Guide overlay"
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setIsOpen(false);
          }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full pointer-events-none invisible"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0DEDA] bg-[#FFF1ED] p-4 text-[#2B1B1B]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7A0F1F] text-white shadow-xs">
              <Bot size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-sm font-bold text-[#2B1B1B]">
                  AI Career Guide
                </h3>
                <span className="rounded bg-[#F8E8EA] border border-[#E8D2CE] px-1.5 py-0.5 text-[9px] font-bold text-[#7A0F1F] uppercase tracking-wider">
                  Verified
                </span>
              </div>
              <p className="text-[11px] text-[#765653]">
                Context: {studentDomain}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleClearHistory}
              title="Clear chat history"
              aria-label="Clear chat history"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#765653] hover:bg-[#F5DCDD] hover:text-[#7A0F1F] transition-colors"
            >
              <RotateCcw size={15} />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close Guide"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#765653] hover:bg-[#F5DCDD] hover:text-[#7A0F1F] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 bg-[#FFF9F7]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.sender === "STUDENT" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs ${
                  m.sender === "STUDENT"
                    ? "bg-[#7A0F1F] text-white rounded-br-xs"
                    : "bg-white text-[#2B1B1B] border border-[#F0E1DE] rounded-bl-xs"
                }`}
              >
                <p>{m.text}</p>

                {/* Deep-link action button */}
                {m.actionRoute && (
                  <div className="mt-3 pt-2.5 border-t border-[#F0E1DE]">
                    <Link
                      href={m.actionRoute}
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#7A0F1F] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#650B19] transition-colors"
                    >
                      <span>{m.actionLabel || "Open Action"}</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                )}

                {/* Provenance and citations */}
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-[#907D79]">
                    <ShieldCheck size={11} className="text-emerald-600" />
                    <span>Citations: {m.citations.join(" · ")}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 rounded-2xl bg-white p-3 text-xs text-[#604B49] border border-[#F0E1DE] w-fit shadow-2xs">
              <Loader2 size={14} className="animate-spin text-[#7A0F1F]" />
              <span>Analyzing against your verified Career Passport…</span>
            </div>
          )}

          {errorNote && (
            <div className="rounded-xl bg-[#FFF2D6] p-3 text-xs text-[#92400E] border border-[#F2B63D]/40">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <Lock size={13} />
                <span>Notice</span>
              </div>
              <p>{errorNote}</p>
            </div>
          )}
        </div>

        {/* Suggested Questions (0 AI cost) */}
        <div className="border-t border-[#F0DEDA] p-3 bg-white">
          <p className="text-[11px] font-bold text-[#59413F] mb-1.5 flex items-center gap-1">
            <Sparkles size={12} className="text-[#F2B63D]" />
            <span>Suggested for this screen:</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggested.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSend(q)}
                disabled={loading}
                className="rounded-lg border border-[#F0E1DE] bg-[#FFF9F7] px-2.5 py-1 text-left text-[11px] font-medium text-[#59413F] hover:bg-[#F8E8EA] hover:text-[#7A0F1F] hover:border-[#E8D2CE] transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="border-t border-[#F0DEDA] p-3 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your career path…"
              disabled={loading}
              className="flex-1 rounded-xl border border-[#F0E1DE] bg-[#FFF9F7] px-3.5 py-2.5 text-xs text-[#2B1B1B] placeholder:text-[#907D79] focus:border-[#7A0F1F] focus:outline-none focus:ring-1 focus:ring-[#7A0F1F]"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#7A0F1F] text-white hover:bg-[#650B19] transition-colors disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </form>
          <p className="mt-2 text-center text-[10px] text-[#907D79]">
            Grounds advice in your real profile. Refuses to invent facts.
          </p>
        </div>
      </div>
    </>
  );
}
