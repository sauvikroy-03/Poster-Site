"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, User as UserIcon, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import type { User } from "@supabase/supabase-js";

interface AccountMenuProps {
  user: User;
  onClose: () => void;
  onLogout: () => void;
}

export default function AccountMenu({
  user,
  onClose,
  onLogout,
}: AccountMenuProps) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch for client theme
  useEffect(() => {
    setMounted(true);
  }, []);

  const goTo = (path: string) => {
    onClose();
    router.push(path);
  };

  const isDarkMode = mounted && resolvedTheme === "dark";

  return (
    <div className="w-64 overflow-hidden border-2 border-border bg-card shadow-[4px_4px_0_0_var(--border)]">
      {/* Header */}
      <div className="border-b-2 border-border px-4 py-3">
        <p className="font-mono text-[10px] font-black uppercase tracking-widest text-foreground/70">
          ACCOUNT
        </p>
        <p className="mt-0.5 truncate text-sm font-bold text-foreground">
          {user.email}
        </p>
      </div>

      {/* Vertical action list */}
      <Command className="bg-transparent">
        <CommandList>
          <CommandGroup className="p-1.5">
            <CommandItem
              onSelect={() => goTo("/account?tab=orders")}
              className="flex cursor-pointer items-center gap-3 bg-transparent px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-muted data-[selected=true]:bg-muted"
            >
              <Package className="h-4 w-4 text-foreground" />
              ORDERS
            </CommandItem>

            <CommandItem
              onSelect={() => goTo("/account?tab=profile")}
              className="flex cursor-pointer items-center gap-3 bg-transparent px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-muted data-[selected=true]:bg-muted"
            >
              <UserIcon className="h-4 w-4 text-foreground" />
              PROFILE
            </CommandItem>

            {/* Mobile Dark Mode Toggle Item (Visible on mobile only) */}
            <div className="flex items-center justify-between border-t-2 border-border px-3 py-2.5 sm:hidden">
              <Label
                htmlFor="mobile-theme-toggle"
                className="flex cursor-pointer items-center gap-3 font-mono text-xs font-bold uppercase tracking-wider text-foreground"
              >
                {isDarkMode ? (
                  <>
                    <Moon className="h-4 w-4 text-foreground" />
                    <span>DARK MODE</span>
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4 text-foreground" />
                    <span>LIGHT MODE</span>
                  </>
                )}
              </Label>
              {mounted && (
                <Switch
                  id="mobile-theme-toggle"
                  checked={isDarkMode}
                  onCheckedChange={(checked) =>
                    setTheme(checked ? "dark" : "light")
                  }
                  className="border-2 border-border data-[state=checked]:bg-primary data-[state=unchecked]:bg-background"
                />
              )}
            </div>

            <CommandSeparator className="my-1 border-t-2 border-border" />

            <CommandItem
              onSelect={() => {
                onClose();
                onLogout();
              }}
              className="flex cursor-pointer items-center gap-3 bg-transparent px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-destructive transition-colors hover:bg-destructive/10 data-[selected=true]:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 text-destructive" />
              LOG OUT
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}