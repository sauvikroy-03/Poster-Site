"use client";

import React from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AddressListCard, { SavedAddress } from "@/components/Profile/AddressListCard";

interface ChangeAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addresses: SavedAddress[];
  onEdit: (address: SavedAddress) => void;
  onSetDefault: (id: string) => void;
  onAddNew: () => void;
}

export default function ChangeAddressDialog({
  open,
  onOpenChange,
  addresses,
  onEdit,
  onSetDefault,
  onAddNew,
}: ChangeAddressDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>Change Delivery Address</DialogTitle>
          <DialogDescription>
            Choose the address you&apos;d like your order delivered to.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <AddressListCard
            addresses={addresses}
            onEdit={onEdit}
            onSetDefault={onSetDefault}
          />

          <Button
            type="button"
            variant="outline"
            onClick={onAddNew}
            className="w-full rounded-xl py-5 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add new address
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}