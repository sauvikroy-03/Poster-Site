"use client"

import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import ProjectDataInterface from "@/types/ItemDetails";
import FeaturedCard from "./FeaturedCard";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./skeletons/SK_ProductCard";
import Link from "next/link";
export default function TrendingPosters() {
const[products,setProducts]=useState<ProjectDataInterface[]>([])
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/product");

        if (response.ok) {
          const data = (await response.json()) as ProjectDataInterface[];
          setProducts(data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);
  return (
    <div className="border-t-2 border-black bg-[#eeece7] w-full">
      <div className="mx-auto max-w-[1400px] px-6 py-16 sm:px-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="mb-4 text-[13px] font-bold uppercase tracking-[0.14em] text-black">
              This week
            </p>
            <h1 className="mb-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-black sm:text-5xl lg:text-[56px]">
              Trending Posters
            </h1>
            <p className="max-w-[520px] text-lg leading-relaxed text-neutral-600">
              The prints moving fastest out of our studio right now.
            </p>
          </div>

          <Link
            href="/categories"
            className="group inline-flex items-center gap-2 whitespace-nowrap pb-1.5 text-[13px] font-bold uppercase tracking-[0.1em] text-black"
          >
           Shop All
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>

        
        </div>
<div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
             {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            : products
                .slice(0, 4)
                .map((p) => <ProductCard key={p.prod_id} product={p} />)}
        </div>
      </div>
    </div>
  );
}