"use client";
import React from "react";
import { Sparkles, Frame, Truck, Ruler, CheckCircle2 } from "lucide-react";

interface FeatureItem {
  icon: React.ElementType;
  title: string;
  description: string;
}

const features: FeatureItem[] = [
  {
    icon: Sparkles,
    title: "MUSEUM QUALITY PRINTS",
    description:
      "200–260 GSM archival, acid-free stock with pigment inks rated to resist fading for decades.",
  },
  {
    icon: Frame,
    title: "PREMIUM FRAMES",
    description:
      "Matte black, natural oak and brushed aluminium with shatter-resistant acrylic and hanging kit.",
  },
  {
    icon: Truck,
    title: "FAST DELIVERY ACROSS INDIA",
    description:
      "2–4 days in metros, 24,000+ serviceable pin codes, and rigid protective packaging every time.",
  },
  {
    icon: Ruler,
    title: "MADE FOR EVERY SPACE",
    description:
      "From A4 desk prints to 24×36 statement pieces, sized for hostels, homes and studios alike.",
  },
];

export default function WhyPosterly() {
  return (
    // Steps to bg-background after ReviewsSection's bg-muted
    // border-b-2 maintains the continuous 2px structural separation
    <section className="w-full border-b-2 border-border bg-muted px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
      <div className="mx-auto max-w-7xl">
        {/* Eyebrow badge */}
        <div className="mb-4 inline-flex items-center gap-1.5 border-2 border-border bg-card px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-foreground shadow-[2px_2px_0_0_var(--border)]">
          <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
          <span>Why Posterly</span>
        </div>

        {/* Heading */}
        <h2 className="mb-10 max-w-2xl text-4xl font-black uppercase leading-[1.05] tracking-tight text-foreground sm:mb-14 sm:text-5xl lg:text-6xl">
          Built like a product, not a print job.
        </h2>

        {/* Feature cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col border-2 border-border bg-card p-6 shadow-[5px_5px_0_0_var(--border)] transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-[7px_7px_0_0_var(--border)]"
            >
              {/* Icon container: Terracotta accent with brutalist border & mini shadow */}
              <div className="mb-6 flex h-11 w-11 items-center justify-center border-2 border-border bg-accent text-accent-foreground shadow-[2px_2px_0_0_var(--border)]">
                <Icon size={20} strokeWidth={2.5} />
              </div>

              <h3 className="mb-3 text-base font-black uppercase leading-snug text-foreground sm:text-lg">
                {title}
              </h3>

              <p className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}