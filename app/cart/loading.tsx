import { ChevronRight } from "lucide-react";

export default function CartLoading() {
  return (
    <div className="min-h-screen w-full bg-[#fbfaf8]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumb Skeleton */}
        <div className="mb-4 flex items-center gap-1.5 text-sm text-neutral-400">
          <span>Home</span>
          <ChevronRight size={14} />
          <span className="font-semibold text-black">Cart</span>
        </div>

        {/* Heading Skeleton */}
        <h1 className="mb-8 text-4xl font-extrabold uppercase tracking-tight text-black sm:text-5xl">
          Your Cart
        </h1>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5 lg:col-span-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex h-24 animate-pulse gap-4 rounded-xl bg-neutral-100 p-3" />
            ))}
          </div>

          <div className="flex flex-col gap-6">
            <div className="h-40 animate-pulse rounded-2xl border border-neutral-200 bg-white p-6" />
            <div className="h-64 animate-pulse rounded-2xl border border-neutral-200 bg-white p-6" />
          </div>
        </div>
      </div>
    </div>
  );
}