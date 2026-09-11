export type WhatsAppSendResult = { sent: boolean; reason?: string };

const GRAPH_API_VERSION = "v21.0";

/**
 * Direct fetch to the Meta WhatsApp Cloud API — no SDK needed. No-ops (never
 * throws) until WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID are set, see
 * todo/my-work/whatsapp-business-api-setup.md. This is deliberately safe to
 * ship before that account exists: every caller must treat `sent: false,
 * reason: "not_configured"` as expected, not as an error to surface.
 *
 * WhatsApp requires a pre-approved template for any message outside a 24h
 * user-initiated session (reminders and OTPs always are), so this only sends
 * template messages, never freeform text.
 */
export async function sendWhatsAppTemplate(params: {
  to: string; // E.164, e.g. +8801XXXXXXXXX
  templateName: string;
  languageCode?: string;
  bodyParams?: string[];
}): Promise<WhatsAppSendResult> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.warn(
      "[notify/whatsapp] WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set — message not sent. See todo/my-work/whatsapp-business-api-setup.md."
    );
    return { sent: false, reason: "not_configured" };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: params.to,
          type: "template",
          template: {
            name: params.templateName,
            language: { code: params.languageCode ?? "en" },
            ...(params.bodyParams && params.bodyParams.length > 0
              ? {
                  components: [
                    {
                      type: "body",
                      parameters: params.bodyParams.map((text) => ({ type: "text", text })),
                    },
                  ],
                }
              : {}),
          },
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[notify/whatsapp] send failed:", res.status, body);
      return { sent: false, reason: `http_${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    console.error("[notify/whatsapp] send threw:", err);
    return { sent: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

export function isWhatsAppConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}
