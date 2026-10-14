import React from "react";

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  intro?: string;
  children: React.ReactNode;
}

export default function LegalPage({ title, lastUpdated, intro, children }: LegalPageProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
      {intro && <p className="mt-6 text-sm leading-relaxed text-foreground">{intro}</p>}
      <div className="mt-8 flex flex-col gap-8">{children}</div>
    </div>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-foreground">{heading}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}