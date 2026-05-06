export default function PageLoadingSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar skeleton */}
      <aside className="hidden md:flex flex-col w-[220px] bg-[#003366] flex-shrink-0 min-h-screen">
        {/* Logo */}
        <div className="px-4 pt-6 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15" />
            <div className="space-y-1.5">
              <div className="h-3 w-16 rounded bg-white/20" />
              <div className="h-2 w-24 rounded bg-white/10" />
            </div>
          </div>
        </div>
        {/* User info */}
        <div className="px-4 pt-4 pb-3 border-b border-white/10 space-y-1.5">
          <div className="h-3 w-28 rounded bg-white/15 animate-pulse" />
          <div className="h-2 w-20 rounded bg-white/10 animate-pulse" />
        </div>
        {/* Nav items */}
        <div className="px-3 pt-4 space-y-1">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="h-9 rounded-xl bg-white/10 animate-pulse"
              style={{ opacity: 1 - i * 0.1 }}
            />
          ))}
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 pt-14 md:pt-0 flex flex-col">
        {/* Header */}
        <div className="hidden md:flex items-center gap-3 bg-white border-b border-gray-200 px-8 py-4">
          <div className="w-9 h-9 rounded-lg bg-gray-200 animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
            <div className="h-2.5 w-28 rounded bg-gray-100 animate-pulse" />
          </div>
        </div>

        <main className="flex-1 px-4 md:px-8 py-6 space-y-4">
          {/* Filter bar skeleton */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex gap-3">
              <div className="h-9 flex-1 rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-9 w-32 rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-9 w-32 rounded-lg bg-gray-100 animate-pulse" />
            </div>
          </div>

          {/* Table skeleton */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Table header */}
            <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex gap-6">
              {[40, 28, 20, 16].map((w, i) => (
                <div key={i} className={`h-3 w-${w} rounded bg-gray-200 animate-pulse`} style={{ width: `${w * 4}px` }} />
              ))}
            </div>
            {/* Rows */}
            {[...Array(rows)].map((_, i) => (
              <div
                key={i}
                className="px-6 py-4 border-b border-gray-50 flex gap-6 items-center"
                style={{ opacity: 1 - i * (0.6 / rows) }}
              >
                <div className="h-3.5 rounded bg-gray-200 animate-pulse" style={{ width: '35%' }} />
                <div className="h-3 rounded bg-gray-100 animate-pulse" style={{ width: '20%' }} />
                <div className="h-3 rounded bg-gray-100 animate-pulse" style={{ width: '15%' }} />
                <div className="h-5 w-16 rounded-full bg-gray-100 animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
