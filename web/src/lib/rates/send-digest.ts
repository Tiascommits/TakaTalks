import type { DigestResult } from "./digest";
import { sendEmail, isEmailConfigured } from "@/lib/notify/email";

function formatDigestText(digest: DigestResult): string {
  const lines: string[] = [];

  if (digest.failedAdapters.length > 0) {
    lines.push("FAILED ADAPTERS:");
    for (const f of digest.failedAdapters) {
      lines.push(`- ${f.name} (${f.shortCode}): ${f.errorMessage ?? "unknown error"} at ${f.attemptedAt.toISOString()}`);
    }
    lines.push("");
  }

  if (digest.unconfiguredBanks.length > 0) {
    lines.push("BANKS WITH NO ADAPTER:");
    for (const b of digest.unconfiguredBanks) lines.push(`- ${b.name} (${b.shortCode})`);
    lines.push("");
  }

  if (digest.changedRates.length > 0) {
    lines.push("SIGNIFICANT RATE CHANGES:");
    for (const c of digest.changedRates) {
      lines.push(
        `- ${c.name} ${c.instrument} ${c.termMonths}mo: ${c.previousPct}% -> ${c.currentPct}% (${c.deltaPct > 0 ? "+" : ""}${c.deltaPct.toFixed(2)}pp)`
      );
    }
  }

  return lines.join("\n");
}

function isDigestEmpty(digest: DigestResult): boolean {
  return (
    digest.failedAdapters.length === 0 &&
    digest.unconfiguredBanks.length === 0 &&
    digest.changedRates.length === 0
  );
}

/**
 * Only sends when there's something worth a human look, and only when both
 * the email channel and ADMIN_EMAIL are configured — silently no-ops
 * otherwise (the admin page's own digest view is the fallback either way).
 */
export async function sendDigestEmail(digest: DigestResult): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!isEmailConfigured() || !adminEmail) return false;
  if (isDigestEmpty(digest)) return false;

  const { sent } = await sendEmail({
    to: adminEmail,
    subject: "Takatox: rate-scrape digest — action needed",
    text: formatDigestText(digest),
  });
  return sent;
}
