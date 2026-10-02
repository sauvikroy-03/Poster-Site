"use client";

import React from "react";
import { Building2, Home, Pencil } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { AddressType } from "@/components/Profile/BasicDetails";

export interface SavedAddress {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_country_iso2: string;
  phone_dial_code: string;
  phone_number: string;
  address_line1: string;
  landmark: string | null;
  pincode: string;
  city: string;
  state: string;
  country: string;
  address_type: AddressType;
  is_default: boolean;
}

interface AddressListProps {
  addresses: SavedAddress[];
  onEdit: (address: SavedAddress) => void;
  onSetDefault: (id: string) => void;
}

export default function AddressList({
  addresses,
  onEdit,
  onSetDefault,
}: AddressListProps) {
  const defaultAddressId = addresses.find((a) => a.is_default)?.id ?? "";

  return (
    <div className="w-full">
      <RadioGroup
        aria-label="Default address"
        value={defaultAddressId}
        onValueChange={(value) => {
          if (typeof value === "string" && value !== defaultAddressId) {
            onSetDefault(value);
          }
        }}
        className="flex flex-col gap-4"
      >
        {addresses.map((a) => {
          const isSelected = a.id === defaultAddressId;

          return (
            <div
              key={a.id}
              onClick={() => {
                if (!isSelected) onSetDefault(a.id);
              }}
              className={`relative flex cursor-pointer items-start justify-between gap-3 border-2 border-border bg-card p-4 transition-all duration-150 ease-out select-none ${
                isSelected
                  ? "translate-x-1 translate-y-1 shadow-none bg-accent/25"
                  : "shadow-[4px_4px_0_0_var(--border)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--border)] active:translate-x-1 active:translate-y-1 active:shadow-none"
              }`}
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <RadioGroupItem
                  value={a.id}
                  id={`default-${a.id}`}
                  aria-label="Set as default address"
                  className={`mt-0.5 h-4 w-4 rounded-none border-2 border-border bg-background transition-all ${
                    isSelected
                      ? "shadow-none data-[state=checked]:border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      : "shadow-[1px_1px_0_0_var(--border)]"
                  } focus-visible:ring-0 focus-visible:ring-offset-0`}
                />

                <div className="min-w-0 flex-1 space-y-1.5">
                  {/* Header Row: Name & Brutalist Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="max-w-full truncate text-sm font-black uppercase tracking-tight text-foreground">
                      {a.first_name} {a.last_name}
                    </p>

                    <div className="inline-flex items-center gap-1 border-2 border-border bg-muted px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-foreground shadow-[1px_1px_0_0_var(--border)]">
                      {a.address_type === "home" ? (
                        <Home className="h-3 w-3 stroke-[2.5]" />
                      ) : (
                        <Building2 className="h-3 w-3 stroke-[2.5]" />
                      )}
                      {a.address_type}
                    </div>

                    {a.is_default && (
                      <div className="border-2 border-border bg-primary px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary-foreground shadow-[1px_1px_0_0_var(--border)]">
                        Default
                      </div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <p className="text-xs font-bold text-muted-foreground">
                    {a.phone_dial_code} {a.phone_number}
                  </p>

                  {/* Street & Postal Details */}
                  <div className="border-l-2 border-border/30 pl-2 text-xs font-semibold leading-relaxed text-foreground/90">
                    <p className="truncate">{a.address_line1}</p>
                    {a.landmark && (
                      <p className="truncate text-muted-foreground">
                        Near: {a.landmark}
                      </p>
                    )}
                    <p className="uppercase">
                      {a.city}, {a.state} {a.pincode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Edit Button: stopPropagation so it doesn't trigger address selection */}
              <button
                type="button"
                aria-label="Edit address"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(a);
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-border bg-card text-foreground shadow-[2px_2px_0_0_var(--border)] transition-transform duration-100 hover:bg-muted active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                <Pencil className="h-3.5 w-3.5 stroke-[2.5]" />
              </button>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
