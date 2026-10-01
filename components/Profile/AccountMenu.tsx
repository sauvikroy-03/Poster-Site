"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Package, User as UserIcon, LogOut } from "lucide-react";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { User } from "@supabase/supabase-js";

interface AccountMenuProps {
  user: User;
  onClose: () => void;
  onLogout: () => void;
}

export default function AccountMenu({ user, onClose, onLogout }: AccountMenuProps) {
  const router = useRouter();

  const goTo = (path: string) => {
    onClose();
    router.push(path);
  };

  return (
    <div className="w-64 overflow-hidden rounded-md border border-black/10 bg-card shadow-xl">
      {/* Header */}
      <div className="border-b border-black/10 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Account
        </p>
        <p className="mt-0.5 truncate text-sm font-medium text-black">
          {user.email}
        </p>
      </div>

      {/* Vertical action list */}
      <Command className="bg-transparent">
        <CommandList>
          <CommandGroup className="p-1.5">
            <CommandItem
              onSelect={() => goTo("/account?tab=orders")}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-black data-[selected=true]:bg-neutral-100"
            >
              <Package className="h-4 w-4 text-neutral-500" />
              ORDERS
            </CommandItem>

            <CommandItem
              onSelect={() => goTo("/account?tab=profile")}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-black data-[selected=true]:bg-neutral-100"
            >
              <UserIcon className="h-4 w-4 text-neutral-500" />
              PROFILE
            </CommandItem>

            <CommandItem
              onSelect={() => {
                onClose();
                onLogout();
              }}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 data-[selected=true]:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              LOG OUT
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}