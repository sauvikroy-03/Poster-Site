import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Poppins } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/toast";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"], // pick the weights you actually use
  variable: "--font-poppins",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Posterly - Posters for Every Wall",
  description:
    "Discover a world of captivating posters at Posterly. Explore our curated collection of high-quality posters, perfect for adding personality and style to any space. From iconic movie prints to stunning artwork, find the perfect poster to express yourself and transform your walls.",
  keywords: [
    "posters",
    "wall art",
    "home decor",
    "art prints",
    "movie posters",
    "music posters",
    "vintage posters",
    "modern art",
    "graphic design",
    "poster collection",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      
      <body className="min-h-full flex flex-col">
<Navbar/>
 <Toaster />
{children}
        <Footer />
      </body>
    </html>
  );
}
