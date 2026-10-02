"use client";

import React, { useCallback, useEffect, useState } from "react";
import { MapPin, Mail, LogOut, Pencil, Plus, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import BasicDetails from "@/components/Profile/BasicDetails";
import AddressList, { SavedAddress } from "@/components/Profile/AddressListCard";
import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from "@/components/ui/card";

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
        // 401 (logged out) or any error: show the empty state
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
      {/* Contact */}
      <Card className="border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-base font-bold text-foreground">Contact</CardTitle>
          <CardAction>
            {/* <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button> */}
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="truncate text-sm font-medium text-foreground">{email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Addresses */}
      <Card className="border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-base font-bold text-foreground">Addresses</CardTitle>
          <CardAction>
            <Button
              size="sm"
              onClick={handleAddNew}
              className="gap-1.5 bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              Add address
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {isLoadingAddresses ? (
            <div className="flex h-20 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : addresses.length > 0 ? (
            <AddressList
              addresses={addresses}
              onEdit={handleEdit}
              onSetDefault={handleSetDefault}
            />
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-5">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </span>
              <p className="text-sm text-muted-foreground">No addresses added yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sign out */}
      <div className="pt-2">
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="gap-2 border-border font-semibold text-foreground hover:bg-primary hover:text-primary-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
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