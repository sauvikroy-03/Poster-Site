import type { Metadata } from "next";
import ReviewForm from "@/components/Reviews/ReviewForm";

export const metadata: Metadata = {
  title: "Rate your order | Posterly",
  robots: { index: false, follow: false }, // private page, keep it out of search
};

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 text-foreground sm:px-6">
      <ReviewForm orderId={orderId} />
    </div>
  );
}