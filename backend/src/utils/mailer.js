import nodemailer from "nodemailer";

let transporter;
let warnedOnce = false;

/**
 * Lazily builds (and caches) a nodemailer transporter from env vars.
 * Returns null if SMTP isn't configured — callers should treat that as
 * "skip sending" rather than an error, so registration never breaks
 * just because email isn't set up yet.
 */
function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    if (!warnedOnce) {
      console.warn(
        "⚠️  SMTP not configured (SMTP_HOST/SMTP_USER/SMTP_PASS) — registration emails will be skipped. " +
        "Fill these in backend/.env to enable them."
      );
      warnedOnce = true;
    }
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true", // true for port 465, false for 587/STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

/**
 * Sends an email. Never throws — a failed/unconfigured send is logged
 * and reported back via the return value so callers (registration
 * routes) can fire-and-forget this without risking the request itself.
 */
export async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) return { sent: false, reason: "not_configured" };

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

  try {
    await t.sendMail({ from, to, subject, text, html });
    return { sent: true };
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err.message);
    return { sent: false, reason: err.message };
  }
}

/** Welcome email sent right after a landlord or tenant account is created. */
export function welcomeEmail({ name, role }) {
  const isTenant = role === "tenant";
  const subject = isTenant ? "Welcome to your resident portal" : "Welcome to EstateHub";
  const roleLine = isTenant
    ? "Your resident account is active — you can now view your lease, pay rent, submit maintenance requests, and message your property manager."
    : "Your property manager account is active — you can now add properties, units, and tenants, and start tracking rent and maintenance.";

  const text = `Hi ${name},\n\n${roleLine}\n\nIf you didn't create this account, you can ignore this email.\n\n— EstateHub`;
  const html = `
    <div style="font-family:sans-serif;font-size:15px;color:#1c1917;line-height:1.6">
      <p>Hi ${name},</p>
      <p>${roleLine}</p>
      <p style="color:#78716c;font-size:13px">If you didn't create this account, you can ignore this email.</p>
      <p>— EstateHub</p>
    </div>
  `;
  return { subject, text, html };
}
