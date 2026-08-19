"use client";

import { useState } from "react";
import  AuthModal from "@/components/AuthModal";

export default function Home() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <button
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
      />
    </div>
  );
}