import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/tracker/session";
import { isEmailConfigured } from "@/lib/notify/email";
import { isWhatsAppConfigured } from "@/lib/notify/whatsapp";
import { TrackerDashboard } from "@/components/tracker/TrackerDashboard";
import { TrackerHeader } from "@/components/tracker/TrackerHeader";

export const metadata = {
  title: "ইনকাম / ইনভেস্টমেন্ট ট্র্যাকার — Takatox",
};

export default async function TrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ linked?: string; linkError?: string }>;
}) {
  const userId = await getCurrentUserId();
  const params = await searchParams;

  const [incomeEntries, investmentEntries, profile, contact] = userId
    ? await Promise.all([
        prisma.incomeEntry.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
        prisma.investmentEntry.findMany({ where: { userId }, orderBy: { maturityDate: "asc" } }),
        prisma.taxProfile.findUnique({ where: { userId } }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, emailVerifiedAt: true, phone: true, phoneVerifiedAt: true },
        }),
      ])
    : [[], [], null, null];

  return (
    <>
      <TrackerHeader />

      <TrackerDashboard
        initialIncome={JSON.parse(JSON.stringify(incomeEntries))}
        initialInvestments={JSON.parse(JSON.stringify(investmentEntries))}
        initialProfile={profile ? JSON.parse(JSON.stringify(profile)) : null}
        contact={contact ? JSON.parse(JSON.stringify(contact)) : null}
        emailAvailable={isEmailConfigured()}
        whatsappAvailable={isWhatsAppConfigured()}
        linked={params.linked === "1"}
        linkError={params.linkError ?? null}
      />
    </>
  );
}
