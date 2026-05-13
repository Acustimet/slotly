import { createRouterCaller } from "app/_trpc/context";
import { _generateMetadata } from "app/_utils";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { IS_SELF_HOSTED } from "@calcom/lib/constants";
import hasKeyInMetadata from "@calcom/lib/hasKeyInMetadata";
import prisma from "@calcom/prisma";
import { meRouter } from "@calcom/trpc/server/routers/viewer/me/_router";
import { getCachedHasTeamPlan } from "@calcom/web/app/cache/membership";

import { buildLegacyRequest } from "@lib/buildLegacyCtx";

import AppearancePage from "~/settings/my-account/appearance-view";

export const generateMetadata = async () =>
  await _generateMetadata(
    (t) => t("appearance"),
    (t) => t("appearance_description"),
    undefined,
    undefined,
    "/settings/my-account/appearance"
  );

const Page = async () => {
  const session = await getServerSession({ req: buildLegacyRequest(await headers(), await cookies()) });
  const userId = session?.user?.id;
  const redirectUrl = "/auth/login?callbackUrl=/settings/my-account/appearance";

  if (!userId) {
    redirect(redirectUrl);
  }

  const [meCaller, hasTeamPlan, dbUser] = await Promise.all([
    createRouterCaller(meRouter),
    getCachedHasTeamPlan(userId),
    prisma.user.findUnique({ where: { id: userId! }, select: { metadata: true } }),
  ]);

  const user = await meCaller.get();

  if (!user) {
    redirect(redirectUrl);
  }
  const isCurrentUsernamePremium =
    user && hasKeyInMetadata(user, "isPremium") ? !!user.metadata.isPremium : false;
  const slotlyPlan = (dbUser?.metadata as Record<string, unknown> | null)?.closedatePlan;
  const hasSlotlyPaidPlan = slotlyPlan === "pro" || slotlyPlan === "team";
  const hasPaidPlan =
    IS_SELF_HOSTED ? true : hasTeamPlan?.hasTeamPlan || isCurrentUsernamePremium || hasSlotlyPaidPlan;

  return <AppearancePage user={user} hasPaidPlan={hasPaidPlan} />;
};

export default Page;
