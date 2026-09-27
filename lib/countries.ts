// lib/countries.ts
import worldCountries from "world-countries";

export interface Country {
  name: string;
  iso2: string;
  dialCode: string;
}

export const countries: Country[] = worldCountries
  .filter((c) => c.idd?.root) // exclude entries with no dial code data
  .map((c) => ({
    name: c.name.common,
    iso2: c.cca2,
    dialCode: `${c.idd.root}${c.idd.suffixes?.[0] ?? ""}`,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function isoToFlagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}