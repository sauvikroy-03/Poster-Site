"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import ProjectDataInterface from "@/types/ItemDetails";
import HeroProductCard from "./Hero_ProductCard";

export default function Hero() {
  const [products, setProducts] = useState<ProjectDataInterface[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/product");

        if (response.ok) {
          const data = (await response.json()) as ProjectDataInterface[];
          setProducts(data);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <section className="bg-[#f7f5f0] w-full">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="h-5 w-1 bg-red-600" />
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-black/70">
                Edition No. 04 — Indian Pop-Culture Collective
              </span>
            </div>
            <h1 className="text-6xl font-extrabold uppercase leading-[0.95] tracking-tight text-black sm:text-7xl lg:text-8xl">
              Transform
              <br />
              Your
              <br />
              Walls
            </h1>
          </div>

          <div className="flex flex-col items-start gap-4 md:items-end md:text-right">
            <p className="max-w-xs text-sm font-semibold uppercase tracking-wide text-black/70">
              A curated selection of pop-culture artifacts for the modern Indian dwelling.
            </p>
            <button className="group inline-flex items-center gap-2 rounded-md bg-black px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition-transform hover:-translate-y-0.5">
              Shop the Drop
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        <hr className="mt-12 border-t border-black/20" />

        {/* 2 columns on mobile, 4 columns on desktop */}
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:[grid-auto-rows:400px]">
          {/* Row 1 (Mobile): Product 0 alone across full width (2 cols) */}
          <div className="col-span-2 h-[500px] sm:h-[500px] md:row-span-2 md:h-full">
            {products[0] ? (
              <HeroProductCard product={products[0]} />
            ) : (
              <div className="h-full w-full animate-pulse border-2 border-black bg-black/5" />
            )}
          </div>

          {/* Row 2 (Mobile): Product 1 side-by-side */}
          <div className="col-span-1 h-[250px] sm:h-[250px] md:h-full">
            {products[1] ? (
              <HeroProductCard product={products[1]} />
            ) : (
              <div className="h-full w-full animate-pulse border-2 border-black bg-black/5" />
            )}
          </div>

          {/* Row 2 (Mobile): Product 2 side-by-side */}
          <div className="col-span-1 h-[250px] sm:h-[250px] md:h-full">
            {products[2] ? (
              <HeroProductCard product={products[2]} />
            ) : (
              <div className="h-full w-full animate-pulse border-2 border-black bg-black/5" />
            )}
          </div>

          {/* Archive Series banner spans 2 cols across mobile & desktop */}
          <a
            href="#"
            className="col-span-2 flex gap-6 overflow-hidden border-2 border-black border-l-4 border-l-red-600 bg-black p-6 md:col-span-2"
          >
            <img
              src="https://picsum.photos/seed/archive-series/300/300"
              alt="The Archive Series"
              className="hidden h-full w-40 flex-shrink-0 object-cover sm:block"
            />
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <h3 className="text-2xl font-extrabold uppercase tracking-tight text-white">
                  The Archive Series
                </h3>
                <p className="mt-2 max-w-sm text-sm text-white/70">
                  Premium 300 GSM gallery-grade matte paper. Acid-free for archival longevity.
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="border border-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
                  Buy Now
                </span>
                <span className="text-lg font-bold text-white">₹1,499</span>
              </div>
            </div>
          </a>

          {/* Bottom small blocks share row 4 side-by-side on mobile */}
          <div className="col-span-1 flex min-h-[140px] items-center justify-center border-2 border-black bg-black/5 md:min-h-0">
            <span className="text-xs font-bold uppercase tracking-wide text-black/30">
              Coming Soon
            </span>
          </div>

          <div className="col-span-1 flex min-h-[140px] flex-col justify-between border-2 border-black bg-yellow-400 p-5 md:min-h-0">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-black">
              Market Status
            </span>
            <span className="text-3xl font-extrabold uppercase italic tracking-tight text-black">
              New
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}