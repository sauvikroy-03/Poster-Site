// components/Footer.tsx
"use client";
import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t-2 border-black bg-[#f0efeb]">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between sm:gap-8">

          <div className="max-w-xs">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center bg-black text-sm font-extrabold text-white">
                P
              </div>
              <span className="text-lg font-extrabold text-black">Posterly</span>
            </div>
            <p className="text-sm leading-relaxed text-black/60">
              Premium pop-culture posters and wall art, printed on archival paper and delivered across India.
            </p>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-black/50">
              Information
            </p>
            <ul className="flex flex-col gap-3">
              <li>
                <Link href="/about" className="text-sm text-black/70 transition-colors hover:text-black">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-sm text-black/70 transition-colors hover:text-black">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-and-conditions" className="text-sm text-black/70 transition-colors hover:text-black">
                  Terms &amp; Conditions
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-black/50">
              Get In Touch
            </p>
            <a href="mailto:hello@posterly.in" className="text-sm text-black/70 transition-colors hover:text-black">
              hello@posterly.in
            </a>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-black/60">
              Email is the only way to reach us. We reply within one business day.
            </p>
          </div>

        </div>
      </div>

      <div className="border-t border-black/10"></div>

      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-2 text-sm text-black/60 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
          <p>© 2026 Posterly. All rights reserved.</p>
          <p>Made in India · Printed on archival paper</p>
        </div>
      </div>
    </footer>
  );
}