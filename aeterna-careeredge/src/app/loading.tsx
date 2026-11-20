// src/app/loading.tsx
// Clean, universal minimal spinner suitable for all screens and route transitions

export default function RootLoading() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center p-6">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-[#F0E1DE] border-t-[#7A0F1F]"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
