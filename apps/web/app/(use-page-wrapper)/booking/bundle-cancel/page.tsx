import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Purchase cancelled — Slotly",
};

export default function BundleCancelPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <div className="text-subtle mb-6 text-5xl">✕</div>
      <h1 className="text-emphasis mb-3 text-2xl font-bold">Purchase cancelled</h1>
      <p className="text-default mb-8 text-base">
        No charge was made. You can close this page or go back to book a session.
      </p>
      <Link
        href="/"
        className="border-subtle text-default hover:bg-subtle inline-block rounded-lg border px-6 py-3 text-sm font-semibold">
        Go home
      </Link>
    </div>
  );
}
