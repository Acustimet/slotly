import { redirect } from "next/navigation";
import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { buildLegacyCtx } from "@calcom/lib/buildLegacyCtx";
import { headers, cookies } from "next/headers";
import SlotlyLandingPage from "@components/slotly/LandingPage";

export default async function RootPage() {
  const legacyCtx = buildLegacyCtx(await headers(), await cookies());
  const session = await getServerSession({ req: legacyCtx });

  if (session?.user?.id) {
    redirect("/event-types");
  }

  return <SlotlyLandingPage />;
}
