import type { Metadata } from "next";
import CustomizeStudio from "@/components/Customize/CustomizeStudio";

export const metadata: Metadata = {
  title: "Customize your poster | Posterly",
  description: "Upload a photo or grab a Pinterest pin and turn it into a poster.",
};

export default function CustomizePage() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto max-w-[1100px] px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-6 flex items-center gap-3">
          <span className="h-3.5 w-3.5 border-2 border-border bg-accent" />
          <span className="font-mono text-[11px] font-black uppercase tracking-[0.2em] text-foreground">
            Posterly custom studio / 01
          </span>
        </div>

        <h1 className="text-6xl font-black uppercase leading-[0.9] tracking-tighter text-foreground sm:text-8xl">
          Make it
          <br />
          <span className="mt-3 inline-block border-2 border-border bg-accent px-3 shadow-[6px_6px_0_0_var(--border)]">
            Yours.
          </span>
        </h1>

        <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Start with the image that deserves the wall. Upload your own photo or pull one from
          Pinterest. We keep the detail, you make the statement.
        </p>

        <CustomizeStudio />
      </div>
    </div>
  );
}