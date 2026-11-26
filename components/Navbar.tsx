"use client";
import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Moon,
  Sun,
  Search,
  ShoppingBag,
  Heart,
  ChevronDown,
  User as UserIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import AuthModal from "@/components/AuthModal";
import SearchModal from "@/components/Search/SearchModal";
import AccountMenu from "@/components/Profile/AccountMenu";
import CartDrawer from "@/components/Cart/CartDrawer";
import type { CartItemData } from "@/components/Cart/Item";
import { createClient } from "@/lib/client";
import { CART_UPDATED_EVENT } from "@/lib/cart-events";
import type { User } from "@supabase/supabase-js";
import { playMechanicalClick } from "@/lib/sounds";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const NAV_LINKS = [
  { href: "/categories", label: "Categories" },
  { href: "/customize", label: "Customize" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [drawerSession, setDrawerSession] = useState(0);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (isCartOpen) setIsCartOpen(false);
  }

  const fetchCartItems = useCallback(async (showLoader = false) => {
    if (showLoader) setIsCartLoading(true);
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) setCartItems([]);
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setCartItems(data.items as CartItemData[]);
      }
    } catch {
      // Keep existing cart count on transient network error
    } finally {
      if (showLoader) setIsCartLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthChecked(true);
      if (data.user) void fetchCartItems();
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);

      if (session?.user) {
        void fetchCartItems();
      } else {
        setCartItems([]);
        setIsCartOpen(false);
      }

      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        router.refresh();
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase, router, fetchCartItems]);

  useEffect(() => {
    if (!user) return;
    const onCartUpdated = () => {
      void fetchCartItems();
    };
    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated);
    return () => window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated);
  }, [user, fetchCartItems]);

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
    router.push("/");
    router.refresh();
  };

  const iconBtn = `${FOCUS} relative flex h-10 w-10 cursor-pointer items-center justify-center border-2 border-transparent text-foreground transition-colors hover:border-border hover:bg-muted`;

  const showCart = authChecked && !!user;
  const themeInCartSlot = authChecked && !user;
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartBadgeText = cartCount > 9 ? "9+" : String(cartCount);

  const handleOpenCartDrawer = () => {
    playMechanicalClick();
    setDrawerSession((n) => n + 1);
    setIsCartOpen(true);
    void fetchCartItems(cartItems.length === 0);
  };

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

            {/* Search button: visible on mobile and desktop */}
            <button
              type="button"
              aria-label="Search"
              aria-expanded={isSearchOpen}
              onClick={() => setIsSearchOpen((prev) => !prev)}
              className={iconBtn}
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={2.5} />
            </button>

            {/* Wishlist slot: hidden on mobile, visible on sm and above */}
            {showCart && (
              <Link
                href="/wishlist"
                aria-label="Wishlist"
                className={`${iconBtn} hidden sm:flex`}
              >
                <Heart className="h-[18px] w-[18px]" strokeWidth={2.5} />
              </Link>
            )}

            {/* Cart slot: mobile opens /cart directly, PC opens slide-in drawer */}
            {showCart && (
              <>
                <Link
                  href="/cart"
                  aria-label="Cart"
                  className={`${iconBtn} md:hidden`}
                >
                  <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={2.5} />
                  {cartCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center border border-border bg-accent px-1 font-mono text-[10px] font-black leading-none text-foreground">
                      {cartBadgeText}
                    </span>
                  )}
                </Link>

                <button
                  type="button"
                  onClick={handleOpenCartDrawer}
                  aria-label="Open cart"
                  aria-expanded={isCartOpen}
                  className={`${iconBtn} hidden md:flex`}
                >
                  <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={2.5} />
                  {cartCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center border border-border bg-accent px-1 font-mono text-[10px] font-black leading-none text-foreground">
                      {cartBadgeText}
                    </span>
                  )}
                </button>
              </>
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
                  <span className="flex h-6 w-6 items-center justify-center bg-primary text-primary-foreground">
                    <UserIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
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
                className={`${FOCUS} ml-2 h-10 cursor-pointer border-2 border-border bg-primary px-5 text-sm font-bold text-primary-foreground shadow-[3px_3px_0_0_var(--accent)] transition-[transform,box-shadow] duration-100 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_var(--accent)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none`}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        isLoading={isCartLoading}
        sessionKey={drawerSession}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(phone) => {
          console.log("Authenticated as:", phone);
          setIsAuthOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}