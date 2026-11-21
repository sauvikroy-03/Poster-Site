import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

interface CustomPosterBannerProps {
  /** Page where customers upload an image or paste a URL */
  href?: string;
}

export default function CustomPosterBanner({ href = "/custom" }: CustomPosterBannerProps) {
  return (
    // Full-bleed: the colour runs edge to edge, only the content is width-limited
    <section className="w-full border-y-0 border-border bg-accent">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-6 py-14 sm:px-12 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-1.5 border-2 border-border bg-card px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-foreground shadow-[2px_2px_0_0_var(--border)]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Custom Posters</span>
          </div>

          <h2 className="mb-4 text-4xl font-black uppercase leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[56px]">
            CURATE YOUR
            <br />
            OWN SPACE
          </h2>

          <p className="max-w-[480px] text-lg leading-relaxed text-foreground/80">
            Upload any photo. Printed on museum-grade stock and shipped to your door.
          </p>
        </div>

        <Link
          href={href}
          prefetch={true}
          className={`${FOCUS} group inline-flex w-full flex-shrink-0 items-center justify-center gap-2 border-2 border-border bg-card px-5 py-3 text-[13px] font-black uppercase tracking-[0.1em] text-foreground shadow-[3px_3px_0_0_var(--border)] transition-[transform,box-shadow] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_var(--border)] md:w-auto`}
        >
          Make yours
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}