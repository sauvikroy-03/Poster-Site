"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import ProjectDataInterface from "@/types/ItemDetails";
import HeroProductCard from "./Hero_ProductCard";
import ProductCard from "./ProductCard";

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
    <section className="w-full bg-[#f7f5f0]">
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
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 ">
          {/* Card 0: Full width on mobile, 2x2 grid cell on desktop */}
          <div className="col-span-2 md:col-span-2 md:row-span-2 md:h-full">
            {products[0] ? (
              <ProductCard product={products[0]} />
            ) : (
              <div className="aspect-[4/5] w-full animate-pulse border-2 border-black bg-black/5 md:aspect-auto md:h-full" />
            )}
          </div>

          {/* Card 1: 1 col on mobile, 1 col on desktop */}
          <div className="col-span-1 md:h-full">
            {products[1] ? (
              <ProductCard product={products[1]} />
            ) : (
              <div className="aspect-[3/4] w-full animate-pulse border-2 border-black bg-black/5 md:aspect-auto md:h-full" />
            )}
          </div>

          {/* Card 2: 1 col on mobile, 1 col on desktop */}
          <div className="col-span-1 md:h-full">
            {products[2] ? (
              <ProductCard product={products[2]} />
            ) : (
              <div className="aspect-[3/4] w-full animate-pulse border-2 border-black bg-black/5 md:aspect-auto md:h-full" />
            )}
          </div>

          {/* Archive Series banner */}
          <a
            href="#"
            className="col-span-2 flex min-h-[160px] gap-6 overflow-hidden border-2 border-black border-l-4 border-l-red-600 bg-black p-6 md:col-span-2 md:h-full md:min-h-0"
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

          {/* Bottom small blocks */}
          <div className="col-span-1 flex min-h-[120px] items-center justify-center border-2 border-black bg-black/5 md:h-full md:min-h-0">
            <span className="text-xs font-bold uppercase tracking-wide text-black/30">
              Coming Soon
            </span>
          </div>

          <div className="col-span-1 flex min-h-[120px] flex-col justify-between border-2 border-black bg-yellow-400 p-5 md:h-full md:min-h-0">
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