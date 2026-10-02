"use client";

import React, { useCallback, useEffect, useState } from "react";
import { MapPin, Mail, LogOut, Plus, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import BasicDetails from "@/components/Profile/BasicDetails";
import AddressList, { SavedAddress } from "@/components/Profile/AddressListCard";
import { createClient } from "@/lib/client";

interface ProfilePanelProps {
  email?: string;
}

export default function ProfilePanel({ email }: ProfilePanelProps) {
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

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
      setIsLoadingAddresses(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // ---------- Actions ----------
  const handleAddNew = () => {
    setEditingAddress(null);
    setIsAddressModalOpen(true);
  };

  const handleEdit = (address: SavedAddress) => {
    setEditingAddress(address);
    setIsAddressModalOpen(true);
  };

  const handleSetDefault = async (id: string) => {
    const previous = addresses;

    // Optimistic update
    setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));

    try {
      const res = await fetch("/api/address", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, setDefault: true }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setAddresses(previous);
        toast.error(data.message || "Failed to update default address.");
        return;
      }

      toast.success("Default address updated");
    } catch {
      setAddresses(previous);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Contact Section */}
      <div className="border-2 border-border bg-card p-4 sm:p-5 shadow-[4px_4px_0_0_var(--border)]">
        <div className="mb-4 flex items-center justify-between border-b-2 border-border pb-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground sm:text-base">
            Contact
          </h2>
          <span className="border-2 border-border bg-muted px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-foreground">
            Verified
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center border-2 border-border bg-muted shadow-[2px_2px_0_0_var(--border)]">
            <Mail className="h-4 w-4 stroke-[2.5] text-foreground" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Account Email
            </p>
            <p className="truncate text-sm font-bold text-foreground sm:text-base">
              {email || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Addresses Section */}
      <div className="border-2 border-border bg-card p-4 sm:p-5 shadow-[4px_4px_0_0_var(--border)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-border pb-3">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground sm:text-base">
              Addresses
            </h2>
            {/* <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              {addresses.length} {addresses.length === 1 ? "Address" : "Addresses"} 
            </p> */}
          </div>

          <button
            type="button"
            onClick={handleAddNew}
            className="inline-flex items-center gap-1.5 border-2 border-border bg-primary px-3 py-1.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-[2px_2px_0_0_var(--border)] transition-transform duration-150 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            Add Address
          </button>
        </div>

        <div>
          {isLoadingAddresses ? (
            <div className="flex h-24 items-center justify-center border-2 border-dashed border-border bg-muted/20">
              <Loader2 className="h-5 w-5 animate-spin text-foreground stroke-[2.5]" />
            </div>
          ) : addresses.length > 0 ? (
            <AddressList
              addresses={addresses}
              onEdit={handleEdit}
              onSetDefault={handleSetDefault}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border bg-muted/30 px-4 py-8 text-center sm:flex-row sm:text-left">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center border-2 border-border bg-card shadow-[2px_2px_0_0_var(--border)]">
                <MapPin className="h-4 w-4 stroke-[2.5] text-foreground" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-foreground">
                  No addresses saved
                </p>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Add a delivery location to speed up checkout.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sign Out Action */}
      <div className="pt-1">
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 border-2 border-border bg-background px-4 py-2 text-xs font-black uppercase tracking-wider text-foreground shadow-[3px_3px_0_0_var(--border)] transition-transform duration-150 hover:-translate-y-0.5 hover:bg-destructive hover:text-destructive-foreground active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <LogOut className="h-4 w-4 stroke-[2.5]" />
          Sign Out
        </button>
      </div>

      <BasicDetails
        open={isAddressModalOpen}
        onOpenChange={setIsAddressModalOpen}
        editingAddress={editingAddress}
        onSaved={loadAddresses}
        onSubmit={(details) => {
          console.log("Address submitted:", details);
        }}
      />
    </div>
  );
}
