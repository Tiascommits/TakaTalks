import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/tracker/session";
import { maskDestination } from "@/lib/notify/mask";
import { AccountData } from "@/components/account/AccountData";

export const metadata: Metadata = {
  title: "অ্যাকাউন্ট ও ডেটা — TakaTalks",
  description: "See what TakaTalks has saved for this browser, and delete it.",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const userId = await getCurrentUserId();
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          phone: true,
          taxProfile: { select: { id: true } },
          _count: { select: { incomeEntries: true, investmentEntries: true } },
        },
      })
    : null;

  return (
    <main className="max-w-[720px] mx-auto px-5 mt-8 mb-16">
      <AccountData
        saved={
          user && {
            income: user._count.incomeEntries,
            investments: user._count.investmentEntries,
            taxProfile: !!user.taxProfile,
            contact: [user.email, user.phone].filter((c): c is string => !!c).map(maskDestination),
          }
        }
      />
    </main>
  );
}
