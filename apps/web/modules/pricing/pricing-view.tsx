"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Try it before you buy",
    features: [
      "1 event type",
      "Unlimited bookings",
      "Calendar sync",
      "Email notifications",
      "Slotly watermark",
    ],
    cta: "Get Started Free",
    href: "/signup",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 9,
    description: "For coaches, consultants & freelancers",
    features: [
      "Unlimited event types",
      "Stripe payment at booking",
      "Session bundle packages",
      "Pre-meeting intake forms",
      "No Slotly watermark",
      "Priority email support",
    ],
    cta: "Get Pro",
    href: null,
    highlighted: true,
  },
  {
    id: "team",
    name: "Studio",
    price: 29,
    description: "For practices & agencies",
    features: [
      "Everything in Pro",
      "Multiple booking pages",
      "Collective scheduling",
      "Round-robin routing",
      "API access",
      "Priority support",
    ],
    cta: "Get Studio",
    href: null,
    highlighted: false,
  },
] as const;

type PlanId = (typeof PLANS)[number]["id"];

export default function PricingView({ currentPlan }: { currentPlan?: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (planId: "pro" | "team") => {
    setLoading(planId);
    setError(null);
    try {
      const res = await fetch("/api/slotly/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      if (res.status === 401) {
        router.push(`/auth/login?callbackUrl=/pricing`);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to start checkout. Please try again.");
        return;
      }
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-emphasis mb-3 text-4xl font-bold">Simple, transparent pricing</h1>
        <p className="text-default text-lg">Scheduling with built-in payments. Pick the plan that fits your practice.</p>
        {currentPlan && currentPlan !== "free" && (
          <p className="text-brand mt-3 text-sm font-medium">
            Your current plan: <span className="capitalize">{currentPlan}</span>
          </p>
        )}
      </div>

      {error && (
        <div className="mb-8 rounded-md border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id || (!currentPlan && plan.id === "free");
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-8 ${
                plan.highlighted
                  ? "border-brand-default bg-brand shadow-lg"
                  : "border-subtle bg-default"
              }`}>
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}
              <div className="mb-6">
                <h2
                  className={`mb-1 text-xl font-bold ${plan.highlighted ? "text-white" : "text-emphasis"}`}>
                  {plan.name}
                </h2>
                <p className={`text-sm ${plan.highlighted ? "text-blue-100" : "text-default"}`}>
                  {plan.description}
                </p>
                <div className="mt-4">
                  <span
                    className={`text-4xl font-extrabold ${plan.highlighted ? "text-white" : "text-emphasis"}`}>
                    {plan.price === 0 ? "Free" : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className={`ml-1 text-sm ${plan.highlighted ? "text-blue-100" : "text-default"}`}>
                      /month
                    </span>
                  )}
                </div>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <svg
                      className={`mt-0.5 h-4 w-4 shrink-0 ${plan.highlighted ? "text-orange-300" : "text-brand-default"}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={plan.highlighted ? "text-blue-50" : "text-default"}>{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <div
                  className={`rounded-lg py-2.5 text-center text-sm font-medium ${
                    plan.highlighted ? "bg-white/20 text-white" : "bg-subtle text-default"
                  }`}>
                  Current plan
                </div>
              ) : plan.href ? (
                <a
                  href={plan.href}
                  className={`rounded-lg py-2.5 text-center text-sm font-semibold ${
                    plan.highlighted
                      ? "bg-white text-brand-default hover:bg-blue-50"
                      : "bg-brand text-brand-accent hover:bg-brand-emphasis"
                  }`}>
                  {plan.cta}
                </a>
              ) : (
                <button
                  onClick={() => handleCheckout(plan.id as "pro" | "team")}
                  disabled={loading !== null}
                  className={`rounded-lg py-2.5 text-sm font-semibold transition-opacity disabled:opacity-60 ${
                    plan.highlighted
                      ? "bg-white text-brand-default hover:bg-blue-50"
                      : "bg-brand text-inverted hover:opacity-90"
                  }`}>
                  {loading === plan.id ? "Redirecting…" : plan.cta}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-subtle mt-10 text-center text-xs">
        Prices in USD. Cancel anytime. Test mode — no real charges.
      </p>
    </div>
  );
}
