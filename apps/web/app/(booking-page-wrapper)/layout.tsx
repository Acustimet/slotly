import { headers } from "next/headers";

import PageWrapper from "@components/PageWrapperAppDir";

export default async function BookingPageWrapperLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const nonce = h.get("x-csp-nonce") ?? undefined;

  return (
    <>
      <PageWrapper isBookingPage={true} requiresLicense={false} nonce={nonce}>
        {children}
      </PageWrapper>
      <footer className="py-2 text-center text-xs opacity-50">
        <a
          href="https://github.com/Acustimet/slotly"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline">
          Source code (AGPL-3.0)
        </a>
      </footer>
    </>
  );
}
