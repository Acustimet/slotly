import { redirect } from "next/navigation";
import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { buildLegacyRequest } from "@lib/buildLegacyCtx";
import { headers, cookies } from "next/headers";
import SlotlyLandingPage from "@components/slotly/LandingPage";

export default async function RootPage() {
  const session = await getServerSession({ req: buildLegacyRequest(await headers(), await cookies()) });

  if (session?.user?.id) {
    redirect("/event-types");
  }

  return <SlotlyLandingPage />;
}
