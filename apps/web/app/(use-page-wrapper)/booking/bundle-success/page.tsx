import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Bundle purchased — Slotly",
};

export default function BundleSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <div className="mb-6 text-5xl">✓</div>
      <h1 className="text-emphasis mb-3 text-2xl font-bold">Payment received!</h1>
      <p className="text-default mb-8 text-base">
        Your session bundle purchase is confirmed. Credits will be activated within a minute — use
        the booking link your provider shared to schedule your first session.
      </p>
      {searchParams.session_id && searchParams.session_id.length > 0 && (
        <p className="text-subtle mb-8 text-xs">
          Reference: {searchParams.session_id.slice(0, 24)}…
        </p>
      )}
      <Link
        href="/"
        className="bg-brand text-inverted hover:opacity-90 inline-block rounded-lg px-6 py-3 text-sm font-semibold">
        Go home
      </Link>
    </div>
  );
}
