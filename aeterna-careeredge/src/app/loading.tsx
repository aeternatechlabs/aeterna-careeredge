// src/app/loading.tsx
// Universal Fast Streaming Skeleton for Instant React Suspense Transitions

export default function RootLoading() {
  return (
    <div className="w-full min-h-[60vh] p-4 sm:p-6 lg:p-8 animate-pulse space-y-6">
      {/* Top Header Placeholder */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
        </div>
        <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>

      {/* Grid of Metric / Content Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="h-36 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 space-y-3">
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-8 w-16 bg-slate-300 dark:bg-slate-700 rounded-lg" />
          <div className="h-3 w-36 bg-slate-200/60 dark:bg-slate-800/60 rounded" />
        </div>
        <div className="h-36 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 space-y-3">
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-8 w-20 bg-slate-300 dark:bg-slate-700 rounded-lg" />
          <div className="h-3 w-40 bg-slate-200/60 dark:bg-slate-800/60 rounded" />
        </div>
        <div className="h-36 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 space-y-3">
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-8 w-24 bg-slate-300 dark:bg-slate-700 rounded-lg" />
          <div className="h-3 w-48 bg-slate-200/60 dark:bg-slate-800/60 rounded" />
        </div>
      </div>

      {/* Large Content Section */}
      <div className="h-72 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 space-y-4">
        <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="space-y-2.5">
          <div className="h-4 w-full bg-slate-200/70 dark:bg-slate-800/70 rounded" />
          <div className="h-4 w-5/6 bg-slate-200/60 dark:bg-slate-800/60 rounded" />
          <div className="h-4 w-3/4 bg-slate-200/50 dark:bg-slate-800/50 rounded" />
        </div>
      </div>
    </div>
  );
}
