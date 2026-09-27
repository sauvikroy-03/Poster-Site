"use client";

import React, { useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
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

interface BasicDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (details: BasicDetailsForm) => void;
}

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
}

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
};

export default function BasicDetails({ open, onOpenChange, onSubmit }: BasicDetailsProps) {
  const [form, setForm] = useState<BasicDetailsForm>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof BasicDetailsForm, string>>>({});
  const [isPhonePopoverOpen, setIsPhonePopoverOpen] = useState(false);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");

  const selectedPhoneCountry =
    countries.find((c) => c.iso2 === form.phoneCountryIso2) ?? countries[0];

  const updateField = <K extends keyof BasicDetailsForm>(key: K, value: BasicDetailsForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

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

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit?.(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>Shipping Details</DialogTitle>
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
                  placeholder="Sharma"
                />
                {errors.lastName && <FieldError>{errors.lastName}</FieldError>}
              </Field>
            </div>

            {/* Email + Phone side by side */}
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
                placeholder="House no., street, area"
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
          </FieldGroup>
        </FieldSet>

        <Button
          type="button"
          onClick={handleSubmit}
          className="mt-2 w-full rounded-full bg-black py-5 text-sm font-bold text-white hover:bg-neutral-800"
        >
          Save Details
        </Button>
      </DialogContent>
    </Dialog>
  );
}