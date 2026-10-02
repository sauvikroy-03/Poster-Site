"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Building2, Home, Loader2, MapPin, Plus } from "lucide-react";
import { toast } from "@/components/ui/toast";
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
        toast.add({type:"error",description:data.message || "Failed to update delivery address."});
        return;
      }

      toast.add({type:"success",description:"Delivery address updated"});
    } catch {
      setAddresses(previous);
      toast.add({type:"error",description:"Something went wrong. Please try again."});
    }
  };

  const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0];

  return (
    <>
      {isLoading ? (
        <div className="flex h-20 items-center justify-center border-2 border-border bg-card">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !defaultAddress ? (
        <div className="flex items-center gap-3 border-2 border-dashed border-border bg-muted/30 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-border bg-muted">
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </span>
          <p className="min-w-0 flex-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            No delivery address found
          </p>
          <Button
            type="button"
            size="sm"
            onClick={handleAddNew}
            className="gap-1.5 border-2 border-border bg-primary font-mono text-xs font-black uppercase text-primary-foreground shadow-[2px_2px_0_0_var(--border)] hover:bg-primary/90 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      ) : (
        <div className="border-2 border-border bg-card">
          <div className="flex items-start justify-between gap-3 p-4">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="truncate font-mono text-sm font-black uppercase tracking-tight text-foreground">
                  {defaultAddress.first_name} {defaultAddress.last_name}
                </p>
                <Badge
                  variant="secondary"
                  className="gap-1 rounded-none border border-border bg-secondary font-mono text-[10px] font-bold uppercase text-secondary-foreground"
                >
                  {defaultAddress.address_type === "home" ? (
                    <Home className="h-3 w-3" />
                  ) : (
                    <Building2 className="h-3 w-3" />
                  )}
                  {defaultAddress.address_type}
                </Badge>
                <Badge className="rounded-none border border-border bg-primary font-mono text-[10px] font-bold uppercase text-primary-foreground">
                  Default
                </Badge>
              </div>

              <p className="font-mono text-xs text-muted-foreground">
                {defaultAddress.phone_dial_code} {defaultAddress.phone_number}
              </p>
              <p className="truncate text-xs font-medium text-foreground/80">
                {defaultAddress.address_line1}
              </p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {defaultAddress.city}, {defaultAddress.state} - {defaultAddress.pincode}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsListOpen(true)}
              className="shrink-0 rounded-none border-2 border-border font-mono text-xs font-black uppercase tracking-wider text-foreground hover:bg-muted"
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
