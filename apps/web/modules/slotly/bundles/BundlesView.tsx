"use client";

import { useState } from "react";
import useSWR from "swr";

type Bundle = {
  id: string;
  name: string;
  sessionCount: number;
  price: number;
  currency: string;
  active: boolean;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function BundlesView() {
  const { data, mutate, isLoading } = useSWR<{ bundles: Bundle[] }>(
    "/api/slotly/bundles/manage",
    fetcher
  );
  const [form, setForm] = useState({ name: "", sessionCount: "5", price: "15000" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bundles = data?.bundles ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/slotly/bundles/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          sessionCount: Number(form.sessionCount),
          price: Number(form.price),
          currency: "usd",
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Failed to create bundle");
        return;
      }
      setForm({ name: "", sessionCount: "5", price: "15000" });
      await mutate();
    } catch {
      setError("Network error");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/slotly/bundles/manage?id=${id}`, { method: "DELETE" });
    await mutate();
  };

  const formatPrice = (cents: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-emphasis mb-1 text-2xl font-bold">Session Bundles</h1>
        <p className="text-default text-sm">
          Sell multi-session packages. Clients buy credits upfront; each booking deducts one credit.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="border-subtle bg-default mb-8 space-y-4 rounded-2xl border p-6">
        <h2 className="text-emphasis font-semibold">New bundle</h2>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <label className="text-default mb-1 block text-sm font-medium">Bundle name</label>
          <input
            type="text"
            placeholder="e.g. 5-session coaching pack"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            className="border-default bg-default text-emphasis w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-default mb-1 block text-sm font-medium">Sessions included</label>
            <input
              type="number"
              min={1}
              max={100}
              value={form.sessionCount}
              onChange={(e) => setForm((f) => ({ ...f, sessionCount: e.target.value }))}
              required
              className="border-default bg-default text-emphasis w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-default mb-1 block text-sm font-medium">Price (USD cents)</label>
            <input
              type="number"
              min={100}
              step={100}
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              required
              className="border-default bg-default text-emphasis w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {form.price && (
              <p className="text-subtle mt-1 text-xs">
                = {formatPrice(Number(form.price), "usd")} total
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={creating}
          className="bg-brand text-inverted hover:opacity-90 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50">
          {creating ? "Creating…" : "Create bundle"}
        </button>
      </form>

      <div>
        <h2 className="text-emphasis mb-4 font-semibold">Active bundles</h2>
        {isLoading && <p className="text-subtle text-sm">Loading…</p>}
        {!isLoading && bundles.length === 0 && (
          <p className="text-subtle text-sm">No bundles yet. Create one above.</p>
        )}
        <ul className="space-y-3">
          {bundles.map((b) => (
            <li
              key={b.id}
              className="border-subtle bg-default flex items-center justify-between rounded-xl border px-5 py-4">
              <div>
                <p className="text-emphasis font-medium">{b.name}</p>
                <p className="text-subtle text-sm">
                  {b.sessionCount} sessions · {formatPrice(b.price, b.currency)}
                </p>
                <p className="text-subtle mt-1 font-mono text-xs">ID: {b.id}</p>
              </div>
              <button
                onClick={() => handleDelete(b.id)}
                className="text-subtle hover:text-red-600 text-sm">
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
