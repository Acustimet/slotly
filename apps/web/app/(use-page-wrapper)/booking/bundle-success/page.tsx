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
      <h1 className="text-emphasis mb-3 text-2xl font-bold">Bundle purchased!</h1>
      <p className="text-default mb-8 text-base">
        Your session credits are active. Book your first session using the link your provider shared
        with you.
      </p>
      {searchParams.session_id && (
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
