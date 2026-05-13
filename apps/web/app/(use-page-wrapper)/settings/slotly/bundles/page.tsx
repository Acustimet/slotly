import type { Metadata } from "next";

import BundlesView from "~/slotly/bundles/BundlesView";

export const metadata: Metadata = {
  title: "Session Bundles — Slotly",
  description: "Sell multi-session packages to your clients.",
};

export default function BundlesPage() {
  return <BundlesView />;
}
