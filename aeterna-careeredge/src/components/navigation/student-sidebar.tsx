"use client";

// src/components/navigation/student-sidebar.tsx
// Premium, accessible student sidebar with clear visual hierarchy, 44px touch targets,
// distinctive gold active indicators, collapsible desktop width, and quiet coming soon section.

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/common/BrandLogo";
import {
  LayoutDashboard,
  Fingerprint,
  FileText,
  BookOpen,
  Compass,
  BriefcaseBusiness,
  ClipboardList,
  CalendarDays,
  Settings,
  LogOut,
  Network,
  ShieldCheck,
  Zap,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { FEATURE_REGISTRY } from "@/config/features";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  featureId?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const PRIMARY_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Build",
    items: [
      { label: "Resume Studio", href: "/resume/studio", icon: Sparkles, featureId: "resume-studio" },
      { label: "LinkedIn Builder", href: "/linkedin", icon: Network, featureId: "linkedin-optimizer" },
    ],
  },
  {
    title: "Jobs",
    items: [
      { label: "Job Match", href: "/jobs", icon: BriefcaseBusiness, featureId: "job-matches" },
      { label: "Applications", href: "/applications", icon: ClipboardList, featureId: "applications-tracker" },
      { label: "Role Fit Explorer", href: "/role-fit-explorer", icon: Compass, featureId: "role-fit-explorer" },
    ],
  },
  {
    title: "Track",
    items: [
      { label: "30-Day Sprints", href: "/sprints", icon: Zap, featureId: "employability-sprints" },
      { label: "Interview Prep", href: "/interview-prep", icon: HelpCircle, featureId: "interview-prep" },
    ],
  },
];

const MORE_SECTION: NavItem[] = [
  { label: "1-on-1 Counselling", href: "/counselling", icon: CalendarDays, featureId: "career-counselling" },
  { label: "Pricing & Plans", href: "/pricing", icon: Sparkles, featureId: "pricing" },
];

const COMING_SOON_SECTION: NavItem[] = [
  { label: "SOP Builder", href: "/sop", icon: BookOpen, featureId: "sop-builder" },
];

interface StudentSidebarProps {
  onNavigate?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onLogout?: () => void;
}

export function StudentSidebar({
  onNavigate,
  isCollapsed = false,
  onToggleCollapse,
  onLogout,
}: StudentSidebarProps) {
  const currentPath = usePathname();
  const pathname = currentPath || "";
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [soonOpen, setSoonOpen] = useState(false);

  // Clear optimistic navigation once pathname updates
  useEffect(() => {
    setPendingPath(null);
  }, [pathname]);

  // Auto-expand "More" if current page is within it
  useEffect(() => {
    const activeRoute = pendingPath || pathname;
    if (activeRoute && MORE_SECTION.some((item) => activeRoute.startsWith(item.href))) {
      setMoreOpen(true);
    }
  }, [pathname, pendingPath]);

  const renderNavItem = (item: NavItem, isMuted = false) => {
    const Icon = item.icon;
    const activePath = pendingPath || pathname;
    const active = (() => {
      if (!activePath) return false;
      if (item.href === "/dashboard") {
        return activePath === "/dashboard";
      }
      if (item.href === "/resume") {
        return (
          activePath === "/resume" ||
          (activePath.startsWith("/resume/") && !activePath.startsWith("/resume/studio"))
        );
      }
      if (item.href === "/resume/studio") {
        return activePath === "/resume/studio" || activePath.startsWith("/resume/studio/");
      }
      return activePath === item.href || activePath.startsWith(`${item.href}/`);
    })();

    const isPending = pendingPath === item.href && pathname !== item.href;
    const feat = item.featureId ? FEATURE_REGISTRY[item.featureId] : undefined;
    const isComingSoon = isMuted || feat?.status === "COMING_SOON";

    return (
      <Link
        key={item.href}
        href={item.href}
        prefetch={true}
        onClick={() => {
          if (pathname !== item.href) {
            setPendingPath(item.href);
          }
          onNavigate?.();
        }}
        title={isCollapsed ? item.label : undefined}
        aria-current={active ? "page" : undefined}
        className={[
          "relative group flex items-center min-h-[44px] rounded-xl px-3 py-2 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]",
          isCollapsed ? "justify-center px-2" : "gap-3",
          active
            ? "font-bold text-[#7A0F1F] bg-[#F5DCDD] shadow-2xs"
            : isComingSoon
              ? "text-[#B8A9A5] hover:bg-[#FBE7E4] hover:text-[#59413F]"
              : "text-[#59413F] hover:bg-[#FBE7E4] hover:text-[#2B1B1B]",
          isPending ? "opacity-90" : "",
        ].join(" ")}
      >
        {/* Distinctive Maroon Active Indicator Bar */}
        {active && (
          <span
            className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#7A0F1F] shadow-sm shadow-[#7A0F1F]/40 z-10 pointer-events-none ${
              isPending ? "animate-pulse" : ""
            }`}
          />
        )}

        <Icon
          size={18}
          strokeWidth={active ? 2.2 : 1.8}
          className={[
            "relative z-10 shrink-0 transition-colors",
            active
              ? "text-[#7A0F1F]"
              : isComingSoon
                ? "text-[#B8A9A5]"
                : "text-[#896B66] group-hover:text-[#2B1B1B]",
            isPending ? "animate-pulse" : "",
          ].join(" ")}
          aria-hidden="true"
        />

        {!isCollapsed && <span className="relative z-10 flex-1 truncate">{item.label}</span>}

        {!isCollapsed && isComingSoon && (
          <span className="relative z-10 rounded-full bg-[#F9EEEA] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#907D79]">
            Soon
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside
      aria-label="Student Portal Navigation"
      className={[
        "flex h-full flex-col bg-[#FFF1ED] text-[#59413F] border-r border-[#F0DEDA] select-none transition-all duration-200 ease-in-out",
        isCollapsed ? "w-20" : "w-64",
      ].join(" ")}
    >
      {/* Brand Header & Top Collapse Toggle */}
      <div className="flex h-16 items-center justify-between px-3.5 border-b border-[#F0DEDA] shrink-0">
        {!isCollapsed ? (
          <>
            <BrandLogo tone="light" href="/dashboard" />
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg text-[#765653] hover:text-[#2B1B1B] hover:bg-[#FBE7E4] transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
            )}
          </>
        ) : (
          <div className="flex w-full items-center justify-center">
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Expand sidebar"
                aria-label="Expand sidebar"
                className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl text-[#765653] hover:text-[#2B1B1B] hover:bg-[#FBE7E4] transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation Scroll Area */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-2.5 py-4 focus-visible:outline-none ce-scrollbar">
        {PRIMARY_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#907D79]">
                {section.title}
              </p>
            )}

            <div className="space-y-1">
              {section.items.map((item) => renderNavItem(item))}
            </div>
          </div>
        ))}

        {/* Collapsible "More" Group */}
        <div className="pt-2 border-t border-[#F0DEDA] space-y-1">
          {!isCollapsed ? (
            <button
              type="button"
              onClick={() => setMoreOpen(!moreOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#907D79] hover:text-[#59413F] transition-colors"
            >
              <span>More Features</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`}
              />
            </button>
          ) : (
            <div className="h-px bg-[#F0DEDA] my-2" />
          )}

          {(!isCollapsed ? moreOpen : true) && (
            <div className="space-y-1">
              {MORE_SECTION.map((item) => renderNavItem(item))}
            </div>
          )}
        </div>

        {/* Collapsible "Coming Soon" Group (Quiet at Bottom) */}
        <div className="pt-2 border-t border-[#F0DEDA] space-y-1">
          {!isCollapsed ? (
            <button
              type="button"
              onClick={() => setSoonOpen(!soonOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#907D79] hover:text-[#59413F] transition-colors"
            >
              <span>Coming Soon</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${soonOpen ? "rotate-180" : ""}`}
              />
            </button>
          ) : null}

          {(!isCollapsed ? soonOpen : false) && (
            <div className="space-y-1">
              {COMING_SOON_SECTION.map((item) => renderNavItem(item, true))}
            </div>
          )}
        </div>
      </nav>

      {/* Bottom Footer: Settings & Sign Out */}
      <div className="p-2.5 border-t border-[#F0DEDA] bg-[#F9EAE6] shrink-0 space-y-1">
        <Link
          href="/settings"
          prefetch={true}
          onClick={onNavigate}
          title={isCollapsed ? "Settings" : undefined}
          className={[
            "flex items-center min-h-[44px] rounded-xl px-3 py-2 text-[14px] font-medium text-[#765653] hover:bg-[#FBE7E4] hover:text-[#2B1B1B] transition-all",
            isCollapsed ? "justify-center px-2" : "gap-3",
            pathname === "/settings" ? "bg-[#F5DCDD] text-[#7A0F1F] font-bold" : "",
          ].join(" ")}
        >
          <Settings size={18} className="text-[#896B66]" />
          {!isCollapsed && <span>Settings</span>}
        </Link>

        {onLogout && (
          <button
            type="button"
            onClick={() => {
              if (onNavigate) onNavigate();
              onLogout();
            }}
            title={isCollapsed ? "Sign Out" : undefined}
            className={[
              "w-full flex items-center min-h-[44px] rounded-xl px-3 py-2 text-[14px] font-medium text-[#765653] hover:bg-rose-100/70 hover:text-rose-700 transition-all",
              isCollapsed ? "justify-center px-2" : "gap-3",
            ].join(" ")}
          >
            <LogOut size={18} className="text-[#896B66] group-hover:text-rose-700" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
