// components/Footer.tsx
"use client";
import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t-2 border-border bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between sm:gap-8">

          {/* Brand info */}
          <div className="max-w-xs">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center border-2 border-primary-foreground bg-primary-foreground text-sm font-extrabold text-primary">
                P
              </div>
              <span className="text-lg font-black uppercase tracking-tight text-primary-foreground">
                Posterly
              </span>
            </div>
            <p className="text-sm leading-relaxed text-primary-foreground/70">
              Premium pop-culture posters and wall art, printed on archival paper and delivered across India.
            </p>
          </div>

          {/* Nav links */}
          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-primary-foreground/50">
              Information
            </p>
            <ul className="flex flex-col gap-3">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-and-conditions"
                  className="text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                >
                  Terms &amp; Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-primary-foreground/50">
              Get In Touch
            </p>
            <a
              href="mailto:support@posterly.co.in"
              className="text-sm font-bold text-primary-foreground transition-colors hover:text-accent"
            >
              support@posterly.co.in
            </a>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-primary-foreground/70">
              Email is the only way to reach us. We reply within one business day.
            </p>
          </div>

        </div>
      </div>

      {/* Divider */}
      <div className="border-t-2 border-primary-foreground/15"></div>

      {/* Bottom Bar */}
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground/60 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
          <p>© 2026 Posterly. All rights reserved.</p>
          <p>Made in India · Printed on archival paper</p>
        </div>
      </div>
    </footer>
  );
}