import React from "react";
import { PackageOpen } from "lucide-react";

export default function OrdersPanel() {
  return (
    <div className="flex h-72 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-black/10 bg-white text-center">
      <PackageOpen className="h-8 w-8 text-neutral-300" />
      <p className="text-sm font-bold uppercase tracking-wide text-neutral-400">
        No orders yet
      </p>
    </div>
  );
}