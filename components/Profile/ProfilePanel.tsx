"use client";

import React, { useState } from "react";
import { MapPin, Mail, LogOut, Pencil, Plus } from "lucide-react";
import BasicDetails from "@/components/Profile/BasicDetails";
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
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Contact</CardTitle>
          <CardAction>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-semibold">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100">
              <Mail className="h-4 w-4 text-neutral-500" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-neutral-400">Email</p>
              <p className="truncate text-sm font-medium text-black">{email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Addresses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Addresses</CardTitle>
          <CardAction>
            <Button
              size="sm"
              onClick={() => setIsAddressModalOpen(true)}
              className="gap-1.5 bg-black text-xs font-semibold text-white hover:bg-black/85"
            >
              <Plus className="h-3.5 w-3.5" />
              Add address
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-black/15 bg-neutral-50 px-4 py-5">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100">
              <MapPin className="h-4 w-4 text-neutral-400" />
            </span>
            <p className="text-sm text-neutral-400">No addresses added yet</p>
          </div>
        </CardContent>
      </Card>

      {/* Sign out */}
      <div className="pt-2">
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="gap-2 font-semibold hover:bg-black hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>

      <BasicDetails
        open={isAddressModalOpen}
        onOpenChange={setIsAddressModalOpen}
        onSubmit={(details) => {
          console.log("Address submitted:", details);
        }}
      />
    </div>
  );
}