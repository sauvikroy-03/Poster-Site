"use client";

import React from "react";
import { Building2, Home, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

export default function AddressList({ addresses, onEdit, onSetDefault }: AddressListProps) {
  const defaultAddressId = addresses.find((a) => a.is_default)?.id ?? "";

  return (
    <div className="overflow-hidden rounded-xl border">
      <RadioGroup
        aria-label="Default address"
        value={defaultAddressId}
        onValueChange={(value) => {
          if (typeof value === "string" && value !== defaultAddressId) {
            onSetDefault(value);
          }
        }}
        className="gap-0"
      >
        {addresses.map((a, index) => (
          <React.Fragment key={a.id}>
            {index > 0 && <Separator />}
            <div className="flex items-start gap-3 p-4">
              <RadioGroupItem
                value={a.id}
                id={`default-${a.id}`}
                aria-label="Set as default address"
                className="mt-1"
              />

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="max-w-full truncate text-sm font-semibold text-black">
                    {a.first_name} {a.last_name}
                  </p>
                  <Badge variant="secondary" className="gap-1 capitalize">
                    {a.address_type === "home" ? (
                      <Home className="h-3 w-3" />
                    ) : (
                      <Building2 className="h-3 w-3" />
                    )}
                    {a.address_type}
                  </Badge>
                  {a.is_default && <Badge>Default</Badge>}
                </div>

                <p className="text-xs text-muted-foreground">
                  {a.phone_dial_code} {a.phone_number}
                </p>
                <p className="truncate text-xs text-neutral-700">{a.address_line1}</p>
                <p className="truncate text-xs text-neutral-700">
                  {a.city}, {a.state} - {a.pincode}
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Edit address"
                onClick={() => onEdit(a)}
                className="h-8 w-8 shrink-0"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </React.Fragment>
        ))}
      </RadioGroup>
    </div>
  );
}