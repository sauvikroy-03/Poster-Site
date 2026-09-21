"use client";
import React from "react";
import { Sparkles, Frame, Truck, Ruler } from "lucide-react";

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
    <section className=" border-t-2 border-black w-full bg-[#f7f5f2] px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
      <div className="mx-auto max-w-7xl">
        {/* Eyebrow */}
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-black/50 sm:text-sm">
          Why Posterly
        </p>

        {/* Heading */}
        <h2 className="mb-10 max-w-2xl text-4xl font-extrabold leading-[1.1] text-black sm:text-5xl sm:mb-14 lg:text-6xl">
          Built like a product, not a print job.
        </h2>

        {/* Feature cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col border-2 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform duration-300 ease-out hover:-translate-y-1"
            >
              <div className="mb-6 flex h-11 w-11 items-center justify-center bg-[#e11d2e]">
                <Icon size={20} className="text-white" strokeWidth={2.25} />
              </div>

              <h3 className="mb-3 text-base font-extrabold uppercase leading-snug text-black sm:text-lg">
                {title}
              </h3>

              <p className="text-sm leading-relaxed text-black/60">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}