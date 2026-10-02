"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, Search, ShoppingBag, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import AuthModal from "@/components/AuthModal";
import AccountMenu from "@/components/Profile/AccountMenu";
import { createClient } from "@/lib/client";
import type { User } from "@supabase/supabase-js";
import { playMechanicalClick } from "@/lib/sounds";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  // Prevent hydration mismatch for client-only theme state
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthChecked(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

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
  };

  const initial = user?.email ? user.email.charAt(0).toUpperCase() : null;

  // Flat icon buttons: no border until hover, uses semantic hover states
  const iconBtn = `${FOCUS} flex h-10 w-10 cursor-pointer items-center justify-center border-2 border-transparent text-foreground transition-colors hover:border-border hover:bg-muted`;

  // Cart only for signed-in users; signed-out users get the theme toggle in its place
  const showCart = authChecked && !!user;
  const themeInCartSlot = authChecked && !user;

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const themeButton = (extraClass: string) => (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={toggleTheme}
      className={`${iconBtn} ${extraClass}`}
    >
      {mounted ? (
        resolvedTheme === "dark" ? (
          <Sun className="h-[18px] w-[18px]" strokeWidth={2.5} />
        ) : (
          <Moon className="h-[18px] w-[18px]" strokeWidth={2.5} />
        )
      ) : (
        <div className="h-[18px] w-[18px]" />
      )}
    </button>
  );

  return (
    <>
      <header className="sticky top-0 z-50 border-b-2 border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo */}
          <Link href="/" className={`${FOCUS} flex items-center gap-2.5`}>
            <span className="flex h-8 w-8 items-center justify-center border-2 border-border bg-primary text-sm font-extrabold text-primary-foreground">
              P
            </span>
            <span className="text-lg font-extrabold tracking-tight text-foreground">
              Posterly
            </span>
          </Link>

          {/* Links */}
          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={`${FOCUS} border-b-2 py-1 text-sm font-semibold text-foreground transition-colors ${
                    isActive
                      ? "border-border"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {!themeInCartSlot && themeButton("hidden sm:flex")}

            <button
              type="button"
              aria-label="Search"
              className={`${iconBtn} hidden sm:flex`}
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={2.5} />
            </button>

            {/* Cart slot */}
            {showCart && (
              <Link
                href="/cart"
                prefetch={true}
                aria-label="Cart"
                className={iconBtn}
              >
                <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={2.5} />
              </Link>
            )}
            {themeInCartSlot && themeButton("")}

            {user ? (
              <div className="relative ml-2" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  aria-label="Account menu"
                  aria-expanded={isDropdownOpen}
                  className={`${FOCUS} flex h-10 cursor-pointer items-center gap-2 border-2 border-border bg-card pl-1.5 pr-2.5 text-foreground transition-colors hover:bg-muted`}
                >
                  <span className="flex h-6 w-6 items-center justify-center bg-primary text-xs font-bold text-primary-foreground">
                    {initial}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2">
                    <AccountMenu
                      user={user}
                      onClose={() => setIsDropdownOpen(false)}
                      onLogout={handleLogout}
                    />
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  playMechanicalClick();
                  setIsAuthOpen(true);
                }}
                className={`${FOCUS} ml-2 h-10 cursor-pointer border-2 border-border bg-primary px-5 text-sm font-bold text-primary-foreground shadow-[3px_3px_0_0_var(--border)] transition-[transform,box-shadow] duration-100 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_var(--border)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none`}
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
        }}
      />
    </>
  );
}
