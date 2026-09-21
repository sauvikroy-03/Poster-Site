"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Moon, Search, ShoppingBag } from "lucide-react";
import AuthModal from "@/components/AuthModal";

export default function Navbar() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-black/10 bg-[#ffffff]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-black text-sm font-extrabold text-white">
              P
            </span>
            <span className="text-lg font-extrabold tracking-tight text-black">
              Posterly
            </span>
          </Link>

          {/* Nav links — hidden on small screens */}
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/shop"
              className="text-sm font-medium text-black/70 transition-colors hover:text-black"
            >
              Shop
            </Link>
            <Link
              href="/categories"
              className="text-sm font-medium text-black/70 transition-colors hover:text-black"
            >
              Categories
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-black/70 transition-colors hover:text-black"
            >
              About
            </Link>
          </nav>

          {/* Right side: icons + login */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              aria-label="Toggle theme"
              className="hidden h-9 w-9 items-center justify-center rounded-full text-black/70 transition-colors hover:bg-black/5 hover:text-black sm:flex"
            >
              <Moon className="h-[18px] w-[18px]" />
            </button>
            <button
              aria-label="Search"
              className="hidden h-9 w-9 items-center justify-center rounded-full text-black/70 transition-colors hover:bg-black/5 hover:text-black sm:flex"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
            <button
              aria-label="Cart"
              className="flex h-9 w-9 items-center justify-center rounded-full text-black/70 transition-colors hover:bg-black/5 hover:text-black"
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
            </button>

            <button
              onClick={() => setIsAuthOpen(true)}
              className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-black/85"
            >
              Login
            </button>
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(email) => {
          console.log("Authenticated as:", email);
          setIsAuthOpen(false);
        }}
      />
    </>
  );
}