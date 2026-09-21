import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="bg-[#f7f5f0] w-full">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6">
        {/* Eyebrow + headline + CTA */}
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
              A curated selection of pop-culture artifacts for the modern
              Indian dwelling.
            </p>
            <button className="group inline-flex items-center gap-2 rounded-md bg-black px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition-transform hover:-translate-y-0.5">
              Shop the Drop
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        <hr className="mt-12 border-t border-black/20" />

        {/* Bento poster grid */}
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3 md:[grid-auto-rows:300px]">
          {/* Midnight Reel — tall featured card */}
          <a
            href="#"
            className="group col-span-1 row-span-2 overflow-hidden border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <img
              src="https://picsum.photos/seed/midnight-reel/700/900"
              alt="Midnight Reel poster"
              className="h-[calc(100%-72px)] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div className="flex items-center justify-between border-t-2 border-black px-4 py-3">
              <div>
                <h3 className="text-lg font-extrabold uppercase tracking-tight text-black">
                  Midnight Reel
                </h3>
                <p className="text-xs font-medium uppercase tracking-wide text-black/50">
                  Ref: P-2024-001 / Limited Edition
                </p>
              </div>
              <span className="text-lg font-bold text-black">₹1,299</span>
            </div>
          </a>

          {/* Neon District */}
          <a
            href="#"
            className="group overflow-hidden border-2 border-black bg-white"
          >
            <img
              src="https://picsum.photos/seed/neon-district/600/400"
              alt="Neon District poster"
              className="h-[calc(100%-52px)] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div className="flex items-center justify-between border-t-2 border-black px-4 py-2.5">
              <h3 className="text-sm font-extrabold uppercase tracking-tight text-black">
                Neon District
              </h3>
              <span className="text-sm font-bold text-black">₹1,499</span>
            </div>
          </a>

          {/* Final Boss */}
          <a
            href="#"
            className="group overflow-hidden border-2 border-black bg-white"
          >
            <img
              src="https://picsum.photos/seed/final-boss/600/400"
              alt="Final Boss poster"
              className="h-[calc(100%-52px)] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div className="flex items-center justify-between border-t-2 border-black px-4 py-2.5">
              <h3 className="text-sm font-extrabold uppercase tracking-tight text-black">
                Final Boss
              </h3>
              <span className="text-sm font-bold text-black">₹1,399</span>
            </div>
          </a>

          {/* The Archive Series — wide dark banner */}
          <a
            href="#"
            className="col-span-1 flex gap-6 overflow-hidden border-2 border-black border-l-4 border-l-red-600 bg-black p-6 md:col-span-2"
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
                  Premium 300 GSM gallery-grade matte paper. Acid-free for
                  archival longevity.
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

          {/* Bottom left — plain image card */}
          <a
            href="#"
            className="group overflow-hidden border-2 border-black bg-white"
          >
            <img
              src="https://picsum.photos/seed/roadside-jars/600/400"
              alt="Roadside poster"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </a>

          {/* Market Status — highlight card */}
          <div className="flex flex-col justify-between border-2 border-black bg-yellow-400 p-5">
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