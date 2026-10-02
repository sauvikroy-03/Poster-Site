import { ChevronRight } from "lucide-react";

export default function CartLoading() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumb Skeleton */}
        <div className="mb-4 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <span>Home</span>
          <ChevronRight size={14} className="text-muted-foreground" />
          <span className="font-bold text-foreground">Cart</span>
        </div>

        {/* Heading Skeleton */}
        <h1 className="mb-8 text-4xl font-black uppercase tracking-tight text-foreground sm:text-5xl">
          Your Cart
        </h1>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          {/* Cart Items Container */}
          <div className="flex flex-col gap-4 border-2 border-border bg-card p-5 shadow-[4px_4px_0_0_var(--border)] lg:col-span-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex h-24 animate-pulse items-center gap-4 border-2 border-border bg-muted/60 p-3"
              >
                <div className="h-full w-20 shrink-0 border border-border bg-muted" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="h-4 w-1/2 bg-muted" />
                  <div className="h-3 w-1/4 bg-muted/70" />
                </div>
              </div>
            ))}
          </div>

          {/* Summary / Sidebar Skeletons */}
          <div className="flex flex-col gap-6">
            <div className="h-40 animate-pulse border-2 border-border bg-card p-6 shadow-[4px_4px_0_0_var(--border)]" />
            <div className="h-64 animate-pulse border-2 border-border bg-card p-6 shadow-[4px_4px_0_0_var(--border)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
