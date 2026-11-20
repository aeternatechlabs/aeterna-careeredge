"use client";

import { Menu, LogOut } from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";

interface StudentHeaderProps {
  userName?: string;
  userInitial?: string;
  isSidebarCollapsed?: boolean;
  onMenuClick?: () => void;
  onLogout?: () => void;
}

export function StudentHeader({
  userName = "Student",
  userInitial = "S",
  isSidebarCollapsed = false,
  onMenuClick,
  onLogout,
}: StudentHeaderProps) {
  const handleLogout = onLogout ?? (async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    window.location.href = "/login";
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#F0E1DE] bg-white/95 px-3 sm:px-6 backdrop-blur shrink-0">
      {/* Left: Mobile hamburger + BrandLogo (visible on mobile, and on desktop when sidebar is collapsed) */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="inline-flex md:!hidden h-11 w-11 items-center justify-center rounded-xl text-[#604B49] hover:bg-[#F8E8EA] hover:text-[#7A0F1F] transition-colors touch-target"
        >
          <Menu size={20} />
        </button>

        {/* Brand Logo: Always shown on mobile, and on desktop/tablet only when sidebar is collapsed */}
        <div className={isSidebarCollapsed ? "flex items-center" : "flex items-center md:hidden"}>
          <BrandLogo tone="light" href="/dashboard" />
        </div>
      </div>

      {/* Right: Clean User Profile & Sign Out */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <span className="hidden sm:inline-block text-sm font-semibold text-[#2B1B1B] truncate max-w-[200px]">
          {userName}
        </span>

        <div
          title={userName}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#7A0F1F] to-[#550813] text-sm font-bold text-white shadow-xs ring-1 ring-[#7A0F1F]/20 shrink-0"
        >
          {userInitial}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-[#907D79] hover:text-[#7A0F1F] hover:bg-[#F8E8EA] transition-colors touch-target"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
