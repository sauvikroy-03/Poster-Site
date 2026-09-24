"use client";

import React, { useEffect, useState } from "react";

interface Material {
  id: string;
  material_name: string;
  gsm?: number;
}

interface Category {
  id: string;
  category_name: string;
}

interface ProductVariant {
  prod_size: string;
  prod_material: string;
  prod_price: string;
  compare_at_price: string;

  is_in_stock: boolean;
}

export default function Page() {
  const [files, setFiles] = useState<File[]>([]);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productTags, setProductTags] = useState("");
  const [productCategory, setProductCategory] = useState("");

  const [materials, setMaterials] = useState<Material[]>([]);
  const [productCategories, setProductCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic variants state (starts with 1 empty row)
  const [variants, setVariants] = useState<ProductVariant[]>([
    {
      prod_size: "A4",
      prod_material: "",
      prod_price: "",
      compare_at_price: "",

      is_in_stock: true,
    },
  ]);

  // Fetch categories and materials in parallel
  useEffect(() => {
    async function getCategoriesAndMaterials() {
      try {
        const [catRes, matRes] = await Promise.all([
          fetch("/api/category"),
          fetch("/api/material"),
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          setProductCategories(Array.isArray(catData) ? catData : []);
        }

        if (matRes.ok) {
          const matData = await matRes.json();
          setMaterials(Array.isArray(matData) ? matData : []);
        }
      } catch (error) {
        console.error("Failed to load metadata:", error);
      }
    }

    getCategoriesAndMaterials();
  }, []);

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        prod_size: "",
        prod_material: "",
        prod_price: "",
        compare_at_price: "",
        is_in_stock: true,
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length === 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (
    index: number,
    field: keyof ProductVariant,
    value: string | boolean
  ) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    formData.append("productName", productName);
    formData.append("productDescription", productDescription);
    formData.append("productCategory", productCategory);
    formData.append("productTags", productTags);
    formData.append("variants", JSON.stringify(variants));

    try {
      const response = await fetch("/api/product", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("Upload response:", data);
      
      if (response.ok) {
        alert("Product and variants saved successfully!");
      } else {
        alert(`Error: ${data.error || "Failed to save"}`);
      }
    } catch (error) {
      console.error("Error uploading product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-10 px-4 bg-gray-50">
      <form
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        className="flex flex-col gap-6 w-full max-w-3xl p-8 bg-white border border-gray-200 rounded-2xl shadow-sm text-gray-800"
      >
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 border-b pb-3">
          Add New Product
        </h2>

        {/* Base Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-sm font-semibold text-gray-700">Product Images</label>
            <input
              type="file"
              name="files"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 file:cursor-pointer border border-gray-300 rounded-lg bg-gray-50 p-1.5"
            />
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-sm font-semibold text-gray-700">Product Name</label>
            <input
              type="text"
              placeholder="e.g. Vintage Anime Poster"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-sm font-semibold text-gray-700">Product Description</label>
            <textarea
              placeholder="Short overview of the product..."
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Tags (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. anime, art, framed"
              value={productTags}
              onChange={(e) => setProductTags(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Category</label>
            <select
              value={productCategory}
              onChange={(e) => setProductCategory(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
              required
            >
              <option value="">Select a Category</option>
              {productCategories.map((data) => (
                <option key={data.id} value={data.category_name}>
                  {data.category_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Product Variants Section */}
        <div className="flex flex-col gap-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Product Variants</h3>
              <p className="text-xs text-gray-500">Configure size, material, pricing, and SKU</p>
            </div>
            <button
              type="button"
              onClick={handleAddVariant}
              className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md border border-gray-300 transition"
            >
              + Add Another Variant
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {variants.map((variant, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col gap-3 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Variant #{index + 1}
                  </span>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(index)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  {/* Size */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">Size</label>
                    <input
                      type="text"
                      placeholder="e.g. A3, A4"
                      value={variant.prod_size}
                      onChange={(e) =>
                        handleVariantChange(index, "prod_size", e.target.value)
                      }
                      className="px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  {/* Material Dropdown */}
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-xs font-medium text-gray-600">Material</label>
                    <select
                      value={variant.prod_material}
                      onChange={(e) =>
                        handleVariantChange(index, "prod_material", e.target.value)
                      }
                      className="px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Select Material</option>
                      {materials.map((mat) => (
                        <option
                          key={mat.id}
                          value={`${mat.material_name}${mat.gsm ? ` (${mat.gsm} GSM)` : ""}`}
                        >
                          {mat.material_name} {mat.gsm ? `(${mat.gsm} GSM)` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="499"
                      value={variant.prod_price}
                      onChange={(e) =>
                        handleVariantChange(index, "prod_price", e.target.value)
                      }
                      className="px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  {/* Compare at Price */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">Compare (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="799"
                      value={variant.compare_at_price}
                      onChange={(e) =>
                        handleVariantChange(index, "compare_at_price", e.target.value)
                      }
                      className="px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md"
                    />
                  </div>

                  {/* SKU */}
              
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-3 px-4 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white font-medium text-sm rounded-lg shadow transition active:scale-[0.99]"
        >
          {isSubmitting ? "Saving Product..." : "Save Product & All Variants"}
        </button>
      </form>
    </div>
  );
}