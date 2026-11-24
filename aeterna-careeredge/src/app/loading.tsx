// src/app/loading.tsx
// Universal, beautifully centered premium loading screen with brand emblem and animated ring

export default function RootLoading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FFF9F7]/90 backdrop-blur-xs"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Animated Brand Emblem with Spinning Ring */}
        <div className="relative flex items-center justify-center">
          {/* Subtle Outer Pulse Glow */}
          <div className="absolute h-20 w-20 rounded-full bg-[#7A0F1F]/5 animate-ping" />

          {/* Smooth Spinning Accent Ring with Brand Colors */}
          <div className="h-16 w-16 animate-spin rounded-full border-2 border-[#F0E1DE] border-t-[#7A0F1F] border-r-[#F2B63D]" />

          {/* Centered White Emblem Card */}
          <div className="absolute flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-md shadow-[#7A0F1F]/10 border border-[#F0E1DE]">
            <img
              src="/assets/logos/company-logo.webp"
              alt="Aeterna CareerEdge"
              className="h-6 w-6 object-contain"
            />
          </div>
        </div>

        {/* Brand Label & Animated Indicator */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span className="font-heading text-xs font-bold uppercase tracking-widest text-[#7A0F1F]">
            Aeterna CareerEdge
          </span>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#7A0F1F] animate-bounce" />
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#F2B63D] animate-bounce [animation-delay:0.15s]" />
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#7A0F1F] animate-bounce [animation-delay:0.3s]" />
          </div>
        </div>
      </div>
    </div>
  );
}
