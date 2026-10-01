"use client";

import React, { useEffect, useState } from "react";
import { Building2, Check, ChevronsUpDown, Home, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { countries, isoToFlagEmoji } from "@/lib/countries";
import { toast } from "@/components/ui/toast";
import type { SavedAddress } from "@/components/Profile/AddressListCard";

interface BasicDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass an address to edit it; pass null/undefined to add a new one. */
  editingAddress?: SavedAddress | null;
  /** Called after a successful add/update so the parent can refetch. */
  onSaved?: () => void;
  onSubmit?: (details: BasicDetailsForm) => void;
}

export type AddressType = "home" | "office";

export interface BasicDetailsForm {
  firstName: string;
  lastName: string;
  email: string;
  phoneCountryIso2: string;
  phoneNumber: string;
  address: string;
  landmark: string;
  pincode: string;
  city: string;
  state: string;
  country: string;
  addressType: AddressType;
}

const ADDRESS_TYPES: { value: AddressType; label: string; icon: typeof Home }[] = [
  { value: "home", label: "Home", icon: Home },
  { value: "office", label: "Office", icon: Building2 },
];

const defaultForm: BasicDetailsForm = {
  firstName: "",
  lastName: "",
  email: "",
  phoneCountryIso2: "IN",
  phoneNumber: "",
  address: "",
  landmark: "",
  pincode: "",
  city: "",
  state: "",
  country: "India",
  addressType: "home",
};

const formFromAddress = (a: SavedAddress): BasicDetailsForm => ({
  firstName: a.first_name,
  lastName: a.last_name,
  email: a.email,
  phoneCountryIso2: a.phone_country_iso2,
  phoneNumber: a.phone_number,
  address: a.address_line1,
  landmark: a.landmark ?? "",
  pincode: a.pincode,
  city: a.city,
  state: a.state,
  country: a.country,
  addressType: a.address_type,
});

export default function BasicDetails({
  open,
  onOpenChange,
  editingAddress = null,
  onSaved,
  onSubmit,
}: BasicDetailsProps) {
  const [form, setForm] = useState<BasicDetailsForm>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof BasicDetailsForm, string>>>({});
  const [isPhonePopoverOpen, setIsPhonePopoverOpen] = useState(false);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editingId = editingAddress?.id ?? null;

  const selectedPhoneCountry =
    countries.find((c) => c.iso2 === form.phoneCountryIso2) ?? countries[0];

  const updateField = <K extends keyof BasicDetailsForm>(key: K, value: BasicDetailsForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // Reset / prefill whenever the modal opens
  useEffect(() => {
    if (open) {
      setErrors({});
      setPincodeError("");
      setForm(editingAddress ? formFromAddress(editingAddress) : defaultForm);
    }
  }, [open, editingAddress]);

  // ---------- Form logic ----------
  const handlePincodeChange = async (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 6);
    updateField("pincode", digitsOnly);
    setPincodeError("");

    if (digitsOnly.length !== 6) {
      updateField("city", "");
      updateField("state", "");
      return;
    }

    setIsPincodeLoading(true);
    try {
      const res = await fetch(`/api/pincode?pincode=${digitsOnly}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setPincodeError(data.message || "Pincode not found.");
        updateField("city", "");
        updateField("state", "");
        return;
      }

      updateField("city", data.city);
      updateField("state", data.state);
    } catch {
      setPincodeError("Failed to look up pincode.");
    } finally {
      setIsPincodeLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof BasicDetailsForm, string>> = {};

    if (!form.firstName.trim()) newErrors.firstName = "First name is required.";
    if (!form.lastName.trim()) newErrors.lastName = "Last name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Enter a valid email.";
    if (!/^\d{6,14}$/.test(form.phoneNumber)) newErrors.phoneNumber = "Enter a valid phone number.";
    if (!form.address.trim()) newErrors.address = "Address is required.";
    if (!/^\d{6}$/.test(form.pincode)) newErrors.pincode = "Enter a valid 6-digit pincode.";
    if (!form.city.trim()) newErrors.city = "City could not be determined from the pincode.";
    if (!form.state.trim()) newErrors.state = "State could not be determined from the pincode.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = () => ({
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim().toLowerCase(),
    phone: {
      countryIso2: selectedPhoneCountry.iso2,
      dialCode: selectedPhoneCountry.dialCode,
      number: form.phoneNumber.trim(),
      full: `${selectedPhoneCountry.dialCode}${form.phoneNumber.trim()}`,
    },
    address: {
      type: form.addressType,
      line1: form.address.trim(),
      landmark: form.landmark.trim() || null,
      pincode: form.pincode.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      country: form.country.trim(),
    },
  });

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = buildPayload();
    const isEditing = editingId !== null;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/address", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditing ? { id: editingId, ...payload } : payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.add({type:"error",description:data.message || (isEditing ? "Failed to update address." : "Failed to add address.")});
        return;
      }

      toast.add({type:"success",description:isEditing ? "Address updated" : "Address added"});
      onSubmit?.(form);
      onSaved?.();
      onOpenChange(false);
    } catch {
      toast.add({type:"error",description:"Something went wrong. Please try again."});
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>{editingId ? "Edit Address" : "Shipping Details"}</DialogTitle>
          <DialogDescription>
            We&apos;ll use this to deliver your order and send updates.
          </DialogDescription>
        </DialogHeader>

        <FieldSet>
          <FieldLegend className="sr-only">Basic Details</FieldLegend>
          <FieldGroup>
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!errors.firstName}>
                <FieldLabel htmlFor="firstName">First name</FieldLabel>
                <Input
                  id="firstName"
                  autoComplete="given-name"
                  value={form.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  aria-invalid={!!errors.firstName}
                  placeholder="Sauvik"
                />
                {errors.firstName && <FieldError>{errors.firstName}</FieldError>}
              </Field>

              <Field data-invalid={!!errors.lastName}>
                <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                <Input
                  id="lastName"
                  autoComplete="family-name"
                  value={form.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  aria-invalid={!!errors.lastName}
                  placeholder="Roy"
                />
                {errors.lastName && <FieldError>{errors.lastName}</FieldError>}
              </Field>
            </div>

            {/* Email + Phone: stacked on mobile, side by side from sm: up */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">Email address</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  aria-invalid={!!errors.email}
                  placeholder="you@example.com"
                />
                {errors.email && <FieldError>{errors.email}</FieldError>}
              </Field>

              <Field data-invalid={!!errors.phoneNumber}>
                <FieldLabel htmlFor="phoneNumber">Mobile number</FieldLabel>
                <div className="flex gap-2">
                  <Popover open={isPhonePopoverOpen} onOpenChange={setIsPhonePopoverOpen}>
                    <PopoverTrigger
                      type="button"
                      role="combobox"
                      aria-expanded={isPhonePopoverOpen}
                      className="flex w-[90px] flex-shrink-0 items-center justify-between gap-1 rounded-md border border-input bg-background px-2 py-2 text-sm shadow-sm hover:bg-accent"
                    >
                      <span className="flex items-center gap-1 truncate">
                        <span>{isoToFlagEmoji(selectedPhoneCountry.iso2)}</span>
                        <span className="text-xs">{selectedPhoneCountry.dialCode}</span>
                      </span>
                      <ChevronsUpDown className="h-3 w-3 flex-shrink-0 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0">
                      <Command>
                        <CommandInput placeholder="Search country..." />
                        <CommandList>
                          <CommandEmpty>No country found.</CommandEmpty>
                          <CommandGroup>
                            {countries.map((c) => (
                              <CommandItem
                                key={c.iso2}
                                value={`${c.name} ${c.dialCode}`}
                                onSelect={() => {
                                  updateField("phoneCountryIso2", c.iso2);
                                  setIsPhonePopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    form.phoneCountryIso2 === c.iso2 ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="mr-2">{isoToFlagEmoji(c.iso2)}</span>
                                <span className="flex-1 truncate">{c.name}</span>
                                <span className="text-muted-foreground">{c.dialCode}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <Input
                    id="phoneNumber"
                    type="tel"
                    autoComplete="tel-national"
                    value={form.phoneNumber}
                    onChange={(e) =>
                      updateField("phoneNumber", e.target.value.replace(/\D/g, ""))
                    }
                    aria-invalid={!!errors.phoneNumber}
                    placeholder="98765 43210"
                    className="min-w-0 flex-1"
                  />
                </div>
                {errors.phoneNumber && <FieldError>{errors.phoneNumber}</FieldError>}
              </Field>
            </div>

            {/* Address */}
            <Field data-invalid={!!errors.address}>
              <FieldLabel htmlFor="address">Address</FieldLabel>
              <Input
                id="address"
                autoComplete="street-address"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                aria-invalid={!!errors.address}
                placeholder="Flat / house no., building, street, area"
              />
              {errors.address && <FieldError>{errors.address}</FieldError>}
            </Field>

            {/* Landmark + Country side by side */}
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="landmark">Landmark</FieldLabel>
                <Input
                  id="landmark"
                  value={form.landmark}
                  onChange={(e) => updateField("landmark", e.target.value)}
                  placeholder="Near..."
                />
                <FieldDescription>Optional</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="country">Country</FieldLabel>
                <Select
                  value={form.country}
                  onValueChange={(value) => {
                    if (value) updateField("country", value);
                  }}
                >
                  <SelectTrigger id="country">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.iso2} value={c.name}>
                        <span className="mr-2">{isoToFlagEmoji(c.iso2)}</span>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* Pincode + City + State */}
            <div className="grid grid-cols-3 gap-3">
              <Field data-invalid={!!errors.pincode || !!pincodeError}>
                <FieldLabel htmlFor="pincode">Pincode</FieldLabel>
                <div className="relative">
                  <Input
                    id="pincode"
                    inputMode="numeric"
                    value={form.pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    aria-invalid={!!errors.pincode || !!pincodeError}
                    placeholder="110001"
                    maxLength={6}
                  />
                  {isPincodeLoading && (
                    <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-neutral-400" />
                  )}
                </div>
                {(errors.pincode || pincodeError) && (
                  <FieldError>{errors.pincode || pincodeError}</FieldError>
                )}
              </Field>

              <Field data-invalid={!!errors.city}>
                <FieldLabel htmlFor="city">City</FieldLabel>
                <Input
                  id="city"
                  value={form.city}
                  disabled
                  placeholder="Auto-filled"
                  className="bg-neutral-50"
                />
                {errors.city && <FieldError>{errors.city}</FieldError>}
              </Field>

              <Field data-invalid={!!errors.state}>
                <FieldLabel htmlFor="state">State</FieldLabel>
                <Input
                  id="state"
                  value={form.state}
                  disabled
                  placeholder="Auto-filled"
                  className="bg-neutral-50"
                />
                {errors.state && <FieldError>{errors.state}</FieldError>}
              </Field>
            </div>

            {/* Address type */}
            <Field>
              <FieldLabel id="address-type-label">Address type</FieldLabel>
              <RadioGroup
                aria-labelledby="address-type-label"
                value={form.addressType}
                onValueChange={(value) => {
                  // Narrow explicitly: this Base UI-based RadioGroup can hand
                  // back a wider type than our two-value union.
                  if (value === "home" || value === "office") {
                    updateField("addressType", value);
                  }
                }}
                className="grid grid-cols-2 gap-3"
              >
                {ADDRESS_TYPES.map(({ value, label, icon: Icon }) => {
                  const isSelected = form.addressType === value;
                  return (
                    <label
                      key={value}
                      htmlFor={`address-type-${value}`}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
                        isSelected
                          ? "border-black bg-neutral-50"
                          : "border-input hover:border-black/40"
                      )}
                    >
                      <RadioGroupItem value={value} id={`address-type-${value}`} />
                      <Icon className="h-4 w-4 text-neutral-600" />
                      <span className="text-sm font-semibold text-black">{label}</span>
                    </label>
                  );
                })}
              </RadioGroup>
            </Field>
          </FieldGroup>
        </FieldSet>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="mt-2 w-full rounded-xl bg-black py-5 text-sm font-bold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </span>
          ) : editingId ? (
            "Update Address"
          ) : (
            "Save Details"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}