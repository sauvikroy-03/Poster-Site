"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Moon, Search, ShoppingBag, LogOut, ChevronDown } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import {createClient} from "@/lib/client";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  useEffect(() => {
    // Get whatever session already exists on mount (e.g. page refresh)
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    // React live to sign-in/sign-out without needing a page reload
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsDropdownOpen(false);
    // onAuthStateChange above will fire and clear `user` automatically
  };

  const initial = user?.email ? user.email.charAt(0).toUpperCase() : null;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-black/10 bg-[#f7f5f0]/90 backdrop-blur-lg">
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
            <Link href="/shop" className="text-sm font-medium text-black/70 transition-colors hover:text-black">
              Shop
            </Link>
            <Link href="/categories" className="text-sm font-medium text-black/70 transition-colors hover:text-black">
              Categories
            </Link>
            <Link href="/about" className="text-sm font-medium text-black/70 transition-colors hover:text-black">
              About
            </Link>
          </nav>

          {/* Right side: icons + login/account */}
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

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full bg-black py-2 pl-2 pr-3 text-sm font-semibold text-white transition-colors hover:bg-black/85"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                    {initial}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg">
                    <div className="border-b border-black/10 px-4 py-3">
                      <p className="truncate text-sm font-medium text-black">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-black/70 transition-colors hover:bg-black/5 hover:text-black"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-black/85"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(email) => {
          console.log("Authenticated as:", email);
          setIsAuthOpen(false);
          // no manual user-setting needed — onAuthStateChange picks up
          // the new session automatically once cookies are set
        }}
      />
    </>
  );
}