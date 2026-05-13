"use client";

import Link from "next/link";

const FEATURES = [
  {
    icon: "💳",
    title: "Pay at booking",
    body: "Clients pay when they book — not after. No invoices, no chasing.",
  },
  {
    icon: "🔗",
    title: "One link, done",
    body: "Share your Slotly link. Clients pick a time and pay in one flow.",
  },
  {
    icon: "📦",
    title: "Session bundles",
    body: "Sell 5-session coaching packs upfront. Clients book against their credits.",
  },
];

const SOCIAL_PROOF = [
  { quote: "I got paid before the call even happened. Game changer.", name: "Sarah K.", role: "Business Coach" },
  { quote: "Replaced Calendly + PayPal with one tool. My clients love it.", name: "Marcus T.", role: "Freelance Consultant" },
  { quote: "Setup took 10 minutes. First paid booking same day.", name: "Priya M.", role: "Career Coach" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-2xl font-bold text-indigo-600 tracking-tight">Slotly</span>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Log in
          </Link>
          <Link
            href="/auth/signup"
            className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
            Start free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-20 pb-24 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm font-medium px-3 py-1 rounded-full mb-8">
          <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />
          Built-in payments. No extra tools.
        </div>
        <h1 className="text-6xl font-bold tracking-tight leading-none mb-6">
          Book, pay,{" "}
          <span className="text-indigo-600">done.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Scheduling with built-in payments for coaches, consultants, and freelancers.
          Your clients book and pay in one step — no chasing invoices.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            href="/auth/signup"
            className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
            Start free →
          </Link>
          <p className="text-sm text-gray-400">No credit card required</p>
        </div>
      </section>

      {/* Social proof numbers */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          {[
            { value: "2 min", label: "Setup time" },
            { value: "$0", label: "To start" },
            { value: "1 link", label: "To share" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold text-indigo-600">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Everything a solo pro needs</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof testimonials */}
      <section className="bg-indigo-50 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">From service pros like you</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {SOCIAL_PROOF.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="text-gray-700 mb-4 leading-relaxed">"{t.quote}"</p>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-gray-400 text-xs">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Live in 3 steps</h2>
        <p className="text-gray-500 mb-12">No tech skills needed.</p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "1", title: "Create your service", body: "Set your duration, price, and availability." },
            { step: "2", title: "Share your link", body: "One URL for everything. Put it in your bio or email." },
            { step: "3", title: "Get paid", body: "Client books, pays, done. Money hits your account." },
          ].map((s) => (
            <div key={s.step} className="flex flex-col items-center">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg mb-4">
                {s.step}
              </div>
              <h3 className="font-semibold mb-2">{s.title}</h3>
              <p className="text-gray-500 text-sm">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-indigo-600 text-white px-6 py-20 text-center">
        <h2 className="text-4xl font-bold mb-4">Ready to get paid at booking?</h2>
        <p className="text-indigo-200 mb-8 text-lg">Free forever for 1 service. Upgrade when you're ready.</p>
        <Link
          href="/auth/signup"
          className="inline-block bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg">
          Start free →
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span className="font-semibold text-gray-600">Slotly</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
            <a
              href="https://github.com/Acustimet/slotly"
              className="hover:text-gray-600 transition-colors"
              target="_blank"
              rel="noopener noreferrer">
              Source code
            </a>
          </div>
          <span>© 2025 Slotly</span>
        </div>
      </footer>
    </div>
  );
}
