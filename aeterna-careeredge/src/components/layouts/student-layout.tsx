"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { StudentSidebar } from "@/components/navigation/student-sidebar";
import { StudentHeader } from "@/components/navigation/student-header";
import { CareerGuideDrawer } from "@/components/guidance/career-guide-drawer";
import { PageTransition } from "@/components/ui/motion";

interface StudentLayoutProps {
  children: React.ReactNode;
  userName?: string;
  userInitial?: string;
  studentDomain?: string;
  targetRole?: string;
  onLogout?: () => void;
  fullBleed?: boolean;
}

export function StudentLayout({
  children,
  userName,
  userInitial,
  studentDomain,
  targetRole,
  onLogout,
  fullBleed = false,
}: StudentLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("ce_sidebar_collapsed");
      if (stored !== null) {
        setSidebarCollapsed(stored === "true");
      } else if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        // If tablet on initial mount and user has no saved preference, default to collapsed
        setSidebarCollapsed(true);
      }
    } catch {}
  }, []);

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("ce_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Default logout handler if not provided by caller
  const handleLogout = onLogout ?? (async () => {
    try {
      await fetch("/api/auth/logout", {
          credentials: "include", method: "POST" });
    } catch {}
    window.location.href = "/login";
  });

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        closeMobileMenu();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [mobileMenuOpen]);

  // Sidebar collapsed state (defaults to w-20 on tablet, w-64 on desktop, user can toggle)
  const effectiveCollapsed = sidebarCollapsed;

  return (
    <div
      data-app-theme="careeredge-premium"
      className="app-theme-careeredge min-h-screen bg-[#FFF9F7] text-[#2B1B1B] overflow-x-hidden max-w-full"
    >
      {/* Desktop & Tablet sidebar */}
      <div
        suppressHydrationWarning
        className={`fixed inset-y-0 left-0 z-40 hidden md:block ${
          mounted ? "transition-all duration-200 ease-in-out" : ""
        } ${effectiveCollapsed ? "w-20" : "w-64"}`}
      >
        <StudentSidebar
          isCollapsed={effectiveCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile slide-in drawer with backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation Menu">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMobileMenu}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            />

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 240 }}
              className="absolute inset-y-0 left-0 w-64 max-w-[85vw] shadow-2xl pb-safe"
            >
              <div className="absolute right-3 top-3.5 z-10">
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  aria-label="Close navigation menu"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F5DCDD] text-[#7A0F1F] hover:bg-[#F8E8EA] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <StudentSidebar onNavigate={closeMobileMenu} onLogout={handleLogout} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div
        suppressHydrationWarning
        className={`min-w-0 max-w-full overflow-x-hidden ${
          fullBleed ? "h-screen overflow-hidden flex flex-col" : "min-h-screen"
        } ${
          mounted ? "transition-all duration-200 ease-in-out" : ""
        } ${effectiveCollapsed ? "md:pl-20" : "md:pl-64"}`}
      >
        <StudentHeader
          userName={userName}
          userInitial={userInitial}
          isSidebarCollapsed={effectiveCollapsed}
          onMenuClick={() => setMobileMenuOpen(true)}
          onLogout={handleLogout}
        />

        {/* Luminous route-change progress indicator */}
        <div className="relative h-[2px] w-full bg-transparent overflow-hidden shrink-0">
          <motion.div
            key={pathname}
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: 1, opacity: 0 }}
            style={{ transformOrigin: "left" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-gradient-to-r from-[#7A0F1F] via-[#F2B63D] to-[#650B19] shadow-xs shadow-[#7A0F1F]/30"
          />
        </div>

        <main
          className={
            fullBleed
              ? "flex-1 min-h-0 w-full overflow-hidden flex flex-col"
              : "p-4 sm:p-6 lg:p-8 w-full min-w-0"
          }
        >
          {fullBleed ? children : <PageTransition>{children}</PageTransition>}
        </main>

        {/* Global AI Career Guide Drawer */}
        <CareerGuideDrawer
          studentDomain={studentDomain}
          targetRole={targetRole}
        />
      </div>
    </div>
  );
}
