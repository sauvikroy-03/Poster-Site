"use client";
import ProjectDataInterface from "@/types/ItemDetails";
import { useState,useEffect } from "react";
import  AuthModal from "@/components/AuthModal";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import FeaturedCategories from "@/components/FeaturedCategories";
import Hero from "@/components/Hero";
import TrendingPosters from "@/components/TrendingPosters";
import WhyPosterly from "@/components/WhyPosterly";
import ReviewsSection from "@/components/ReviewsSection";
import Footer from "@/components/Footer";


export default function Home() {
  const [isOpen, setIsOpen] = useState(true);
const[productDetails,setProductDetails]=useState<ProjectDataInterface[]>([])
useEffect(()=>{
    const fetchDetails=async()=>{
        try{
        const result=await fetch("/api/product")
        const data= await result.json()
        if(!data){
           console.log("No data recieved")
        }
        setProductDetails(data);
    }catch(err){
  console.log(err)
    }
    }
    fetchDetails()
},[])


 return (


  <>

    <div className="flex min-h-screen flex-col  items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      {/* <button
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-black px-4 py-2 text-sm text-white"
      >
        Open Auth Modal
      </button>

      <AuthModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={(email) => {
          console.log("Authenticated as:", email);
        }}

      /> */}
<Hero/>
      <FeaturedCategories/>
      <TrendingPosters/>
      <WhyPosterly/>
      <ReviewsSection/>
      
    </div>
    </>
  )
}

 

