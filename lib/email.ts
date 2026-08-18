const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM ?? "Timchenko Art <orders@timchenko-art.com.ua>";

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Server-side transactional email — NOT the same channel as the
 * EmailJS-powered contact form (that one runs client-side, in the
 * visitor's browser, and only ever sends TO the artist). This one runs
 * on the server (webhooks, order-status changes) and sends TO customers,
 * so it needs its own API key: RESEND_API_KEY. See ORDER_EMAILS_GUIDE.md.
 *
 * Deliberately fails soft: logs and returns rather than throwing, so a
 * missing/invalid email config never blocks the actual order-status
 * update (that's the source of truth; the email is a notification about
 * it) or crashes a webhook handler that Stripe/NOWPayments will retry.
 */
export async function sendEmail({ to, subject, html, replyTo }: SendEmailArgs): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY not set — skipping send to ${to}: "${subject}"`);
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to,
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!res.ok) {
      console.error(`[email] send failed (${res.status}) to ${to}:`, await res.text());
      return false;
    }

    return true;
  } catch (err) {
    console.error(`[email] send threw for ${to}:`, err);
    return false;
  }
}
