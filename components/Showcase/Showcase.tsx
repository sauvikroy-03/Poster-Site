import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export default function Showcase() {
  return (
    <section className="w-full border-b-2 border-border bg-card">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-10 px-6 py-16 sm:px-12 lg:grid-cols-12 lg:gap-14 lg:py-20">
        {/* Left copy + CTA */}
        <div className="flex flex-col items-start lg:col-span-5">
          <p className="mb-3 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
            Make space for your favourites
          </p>

          <h2 className="mb-4 text-3xl font-black uppercase leading-[1.03] tracking-tight text-foreground sm:text-4xl lg:text-[46px]">
            A little pop changes the whole room.
          </h2>

          <p className="mb-7 max-w-[440px] text-base leading-relaxed text-muted-foreground sm:text-lg">
            Give the things you love a spot on the wall. Start with the print, size, and corner
            that feel right for you.
          </p>

          <Link
            href="/categories"
            prefetch={true}
            className={`${FOCUS} group inline-flex items-center justify-center gap-2.5 border-2 border-border bg-background px-5 py-3 font-mono text-xs font-black uppercase tracking-[0.12em] text-foreground shadow-[3px_3px_0_0_var(--border)] transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:bg-accent active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_var(--border)]`}
          >
            <span>Find your poster</span>
            <ArrowRight
              className="h-4 w-4 text-destructive transition-transform duration-200 group-hover:translate-x-1 group-hover:text-foreground"
              strokeWidth={2.5}
            />
          </Link>
        </div>

        {/* Right framed showcase visual */}
        <div className="lg:col-span-7">
          <div className="border-2 border-border bg-background p-2 shadow-[6px_6px_0_0_var(--border)] sm:p-3">
            <div className="relative aspect-[16/10] w-full overflow-hidden border border-border/20 bg-muted">
              <Image
                src="/wallposter.jpg"
                alt="Curated posters framed and styled in a sunlit room"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 56vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
