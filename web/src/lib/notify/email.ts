import { Resend } from "resend";

export type EmailSendResult = { sent: boolean; reason?: string };

/**
 * Thin wrapper so the rest of the app never touches the Resend SDK directly.
 * No-ops (never throws) when RESEND_API_KEY isn't set yet — see
 * todo/my-work/email-provider-setup.md. Callers must treat `sent: false` as
 * "this feature isn't configured," not as an unexpected failure.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.warn(
      "[notify/email] RESEND_API_KEY or EMAIL_FROM not set — email not sent. See todo/my-work/email-provider-setup.md."
    );
    return { sent: false, reason: "not_configured" };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html ?? `<p>${params.text}</p>`,
    });
    if (error) {
      console.error("[notify/email] send failed:", error);
      return { sent: false, reason: error.message };
    }
    return { sent: true };
  } catch (err) {
    console.error("[notify/email] send threw:", err);
    return { sent: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}
