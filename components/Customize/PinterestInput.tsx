"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

// Accepts pinterest.com/pin/..., country domains like in.pinterest.com, and pin.it short links
const PIN_REGEX =
  /^https?:\/\/((www|[a-z]{2})\.)?pinterest\.[a-z.]+\/pin\/\S+|^https?:\/\/pin\.it\/\S+/i;

type Status = "idle" | "loading" | "ready" | "error";

export function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z" />
    </svg>
  );
}

interface PinterestInputProps {
  /** Should resolve when the pin image was loaded, or throw an Error with a user-friendly message */
  onResolve: (url: string) => Promise<void>;
}

export default function PinterestInput({ onResolve }: PinterestInputProps) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const runId = useRef(0); // lets us ignore results from an outdated request
  const lastUrl = useRef("");

  const run = async (value: string) => {
    const id = ++runId.current;
    lastUrl.current = value;
    setStatus("loading");
    setMessage("");
    try {
      await onResolve(value);
      if (id !== runId.current) return;
      setStatus("ready");
      setMessage("Pin added.");
    } catch (err) {
      if (id !== runId.current) return;
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Couldn't fetch that pin.");
    }
  };

  // Auto-fetch: a valid link fires almost instantly, an invalid one only complains after a pause
  useEffect(() => {
    const value = url.trim();

    if (!value) {
      runId.current++;
      lastUrl.current = "";
      setStatus("idle");
      setMessage("");
      return;
    }
    if (value === lastUrl.current) return;

    const valid = PIN_REGEX.test(value);
    const timer = setTimeout(
      () => {
        if (valid) {
          run(value);
        } else {
          setStatus("error");
          setMessage("That doesn't look like a pin link. Try pinterest.com/pin/... or pin.it/...");
        }
      },
      valid ? 350 : 900
    );

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // Enter key: fetch right away (also retries the same link after an error)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = url.trim();
    if (PIN_REGEX.test(value)) run(value);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label
        htmlFor="pin-url"
        className="font-mono text-[11px] font-black uppercase tracking-[0.2em] text-foreground"
      >
        Pinterest URL
      </label>

      <div className="relative mt-2">
        <PinterestIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground" />

        <Input
          id="pin-url"
          type="url"
          inputMode="url"
          autoComplete="off"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a pin link, we grab it automatically"
          aria-invalid={status === "error"}
          className={cn(
            FOCUS,
            "h-14 w-full rounded-none border-2 border-border bg-card pl-12 pr-12 text-sm font-semibold text-foreground placeholder:font-medium placeholder:text-muted-foreground focus-visible:bg-card focus-visible:ring-0 focus-visible:border-border",
            status === "error" && "border-destructive bg-destructive/10 text-destructive"
          )}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {status === "loading" ? (
            <Loader2 className="h-5 w-5 animate-spin text-foreground" strokeWidth={2.5} />
          ) : url ? (
            <button
              type="button"
              aria-label="Clear link"
              onClick={() => setUrl("")}
              className={cn(
                FOCUS,
                "flex h-8 w-8 cursor-pointer items-center justify-center border-2 border-border bg-card text-foreground transition-colors hover:bg-muted"
              )}
            >
              <X className="h-4 w-4" strokeWidth={3} />
            </button>
          ) : null}
        </div>
      </div>

      <div aria-live="polite" className="mt-3 min-h-5 text-sm font-bold">
        {status === "loading" && (
          <span className="text-muted-foreground">Fetching your pin...</span>
        )}
        {status === "ready" && (
          <span className="inline-flex items-center gap-1.5 text-foreground">
            <Check className="h-4 w-4" strokeWidth={3} />
            {message}
          </span>
        )}
        {status === "error" && <span className="text-destructive">{message}</span>}
      </div>

      <p className="mt-2 text-xs font-semibold text-muted-foreground">
        Make sure you have permission to print the final artwork.
      </p>
    </form>
  );
}