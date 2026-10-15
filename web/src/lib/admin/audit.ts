import { prisma } from "@/lib/prisma";
import { getCurrentAdminUserId } from "./auth";

/** No-ops silently without an admin session: there's no one to attribute the action to. */
export async function logAdminAction(
  action: string,
  targetType: string,
  targetId: string,
  detail?: unknown
): Promise<void> {
  const adminUserId = await getCurrentAdminUserId();
  if (!adminUserId) return;
  await prisma.adminAuditLog.create({
    data: {
      adminUserId,
      action,
      targetType,
      targetId,
      // JSON round-trip so Dates/etc. become plain JSON-safe values before
      // hitting the Json column, rather than passing live objects through.
      detail: detail === undefined ? undefined : JSON.parse(JSON.stringify(detail)),
    },
  });
}
