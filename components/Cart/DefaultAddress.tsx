"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Building2, Home, Loader2, MapPin, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import BasicDetails from "@/components/Profile/BasicDetails";
import type { SavedAddress } from "@/components/Profile/AddressListCard";
import ChangeAddressDialog from "@/components/Cart/ChangeAddressDialog";

export default function DefaultAddress() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isListOpen, setIsListOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);

  // ---------- Load saved addresses ----------
  const loadAddresses = useCallback(async () => {
    try {
      const res = await fetch("/api/address");
      const data = await res.json();

      if (!res.ok || !data.success) {
        setAddresses([]);
        return;
      }

      setAddresses(data.addresses as SavedAddress[]);
    } catch {
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // ---------- Actions ----------
  const handleAddNew = () => {
    setEditingAddress(null);
    setIsListOpen(false);
    setIsFormOpen(true);
  };

  const handleEdit = (address: SavedAddress) => {
    setEditingAddress(address);
    setIsListOpen(false);
    setIsFormOpen(true);
  };

  const handleSetDefault = async (id: string) => {
    const previous = addresses;

    // Optimistic update + close the popup
    setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));
    setIsListOpen(false);

    try {
      const res = await fetch("/api/address", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, setDefault: true }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setAddresses(previous);
        toast.error(data.message || "Failed to update delivery address.");
        return;
      }

      toast.success("Delivery address updated");
    } catch {
      setAddresses(previous);
      toast.error("Something went wrong. Please try again.");
    }
  };

  const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0];

  return (
    <>
      {isLoading ? (
        <div className="flex h-20 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
        </div>
      ) : !defaultAddress ? (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-black/15 bg-neutral-50 px-4 py-4">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100">
            <MapPin className="h-4 w-4 text-neutral-400" />
          </span>
          <p className="min-w-0 flex-1 text-sm text-neutral-400">Add delivery address</p>
          <Button
            type="button"
            size="sm"
            onClick={handleAddNew}
            className="gap-1.5 bg-black text-xs font-semibold text-white hover:bg-black/85"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <div className="flex items-start gap-3 p-4">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="max-w-full truncate text-sm font-semibold text-black">
                  {defaultAddress.first_name} {defaultAddress.last_name}
                </p>
                <Badge variant="secondary" className="gap-1 capitalize">
                  {defaultAddress.address_type === "home" ? (
                    <Home className="h-3 w-3" />
                  ) : (
                    <Building2 className="h-3 w-3" />
                  )}
                  {defaultAddress.address_type}
                </Badge>
                <Badge>Default</Badge>
              </div>

              <p className="text-xs text-muted-foreground">
                {defaultAddress.phone_dial_code} {defaultAddress.phone_number}
              </p>
              <p className="truncate text-xs text-neutral-700">
                {defaultAddress.address_line1}
              </p>
              <p className="truncate text-xs text-neutral-700">
                {defaultAddress.city}, {defaultAddress.state} - {defaultAddress.pincode}
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsListOpen(true)}
              className="shrink-0 text-xs font-semibold"
            >
              Change
            </Button>
          </div>
        </div>
      )}

     <ChangeAddressDialog
  open={isListOpen}
  onOpenChange={setIsListOpen}
  addresses={addresses}
  onEdit={handleEdit}
  onSetDefault={handleSetDefault}
  onAddNew={handleAddNew}
/>

      <BasicDetails
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingAddress={editingAddress}
        onSaved={loadAddresses}
      />
    </>
  );
}