"use client";

import React, { useEffect, useState } from "react";
import { ClipboardCheck, Package, Truck, PackageCheck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Edit the `statuses` arrays so they match your `order_status` enum.
 * `timeStatuses` (optional) picks which history row supplies the date shown.
 */
const STEPS: {
  key: string;
  label: string;
  icon: typeof Package;
  statuses: string[];
  timeStatuses?: string[];
}[] = [
  { key: "placed", label: "Placed", icon: ClipboardCheck, statuses: ["pending", "confirmed", "processing"], timeStatuses: ["confirmed"] },
  { key: "shipped", label: "Shipped", icon: Package, statuses: ["shipped"] },
  { key: "out_for_delivery", label: "Out for delivery", icon: Truck, statuses: ["out_for_delivery"] },
  { key: "delivered", label: "Delivered", icon: PackageCheck, statuses: ["delivered"] },
];

const CANCELLED = ["cancelled", "canceled"];

export interface StatusHistoryRow {
  status: string;
  changed_at: string;
}

interface OrderTrackerProps {
  /** Current value of orders.status */
  status: string;
  /** Rows from order_status_history for this order */
  history?: StatusHistoryRow[];
}

// Fixed timezone so server and browser always render the same text
const TZ = "Asia/Kolkata";

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: TZ });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ });

const formatStamp = (iso: string) => `${formatDay(iso)}, ${formatTime(iso)}`;

/** Earliest time any of these statuses was recorded */
function firstTime(history: StatusHistoryRow[], statuses: string[]) {
  return history
    .filter((h) => statuses.includes(h.status))
    .map((h) => h.changed_at)
    .sort()[0];
}

export default function OrderTracker({ status, history = [] }: OrderTrackerProps) {
  // Lets the lines draw in once on load
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (CANCELLED.includes(status)) {
    const when = firstTime(history, CANCELLED);
    return (
      <div className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
        <XCircle size={14} />
        <span>Order cancelled</span>
        {when && <span className="font-normal text-red-500">on {formatStamp(when)}</span>}
      </div>
    );
  }

  const found = STEPS.findIndex((s) => s.statuses.includes(status));
  const currentIndex = found === -1 ? 0 : found;
  const isDelivered = status === "delivered";
  const accent = isDelivered ? "bg-emerald-600" : "bg-black";

  const stepData = STEPS.map((step, i) => {
    const isDone = i < currentIndex || isDelivered;
    const isCurrent = i === currentIndex && !isDelivered;
    const isReached = isDone || isCurrent;
    const when = isReached ? firstTime(history, step.timeStatuses ?? step.statuses) : undefined;
    return { step, isDone, isCurrent, isReached, when };
  });

  const hasDates = stepData.some((s) => s.when);

  return (
    <div className="w-full">
      {/* Compact stepper: capped width, left-aligned */}
      <ol className="grid max-w-[26rem] grid-cols-4" aria-label="Order progress">
        {stepData.map(({ step, isDone, isCurrent, isReached, when }, i) => {
          const Icon = step.icon;
          const isLast = i === STEPS.length - 1;

          return (
            <li
              key={step.key}
              aria-current={isCurrent ? "step" : undefined}
              className="flex min-w-0 flex-col items-center gap-2 text-center"
            >
              <span
                className={cn(
                  "flex min-h-[26px] items-end px-0.5 text-[11px] leading-[13px] sm:min-h-0 sm:text-xs",
                  isCurrent ? "font-bold text-black" : isReached ? "font-medium text-neutral-700" : "font-medium text-neutral-400"
                )}
              >
                {step.label}
              </span>

              <div className="relative flex w-full justify-center">
                {/* Line to the next step, drawn in one after another */}
                {!isLast && (
                  <span
                    aria-hidden
                    className="absolute left-1/2 top-1/2 h-0.5 w-full -translate-y-1/2 bg-neutral-200"
                  >
                    <span
                      className={cn(
                        "block h-full transition-[width] duration-500 ease-out motion-reduce:transition-none",
                        accent
                      )}
                      style={{
                        width: mounted && isDone ? "100%" : "0%",
                        transitionDelay: `${i * 200}ms`,
                      }}
                    />
                  </span>
                )}

                <span
                  className={cn(
                    "relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 bg-white",
                    isDone && cn("border-transparent text-white", accent),
                    isCurrent && "border-black text-black ring-4 ring-black/10",
                    !isReached && "border-neutral-200 text-neutral-300"
                  )}
                >
                  <Icon size={13} strokeWidth={2.25} />
                </span>
              </div>

              {/* Date only, no time */}
              <span
                className={cn(
                  "text-[11px] font-medium leading-[14px] text-neutral-500 sm:text-xs",
                  hasDates && "min-h-[14px]"
                )}
              >
                {when ? formatDay(when) : ""}
              </span>
            </li>
          );
        })}
      </ol>

    </div>
  );
}