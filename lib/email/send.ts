import nodemailer from 'nodemailer';

// OVH SMTP configuration. Add these to .env.local / server environment:
//   SMTP_HOST=ssl0.ovh.net
//   SMTP_PORT=465
//   SMTP_USER=your@ovh-email.com
//   SMTP_PASS=your-password
//   EMAIL_FROM="BrainTrain <your@ovh-email.com>"
//
// If any variable is missing the function logs to the console instead of
// throwing — this keeps dev mode fully functional without email credentials.

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendEmail(params: { to: string; subject: string; text: string; html?: string }): Promise<void> {
  const transport = createTransport();

  if (!transport) {
    // No SMTP configured — log so the flow is visible during local dev.
    console.log(`[email:no-smtp] to=${params.to} subject="${params.subject}"\n${params.text}`);
    return;
  }

  const from = process.env.EMAIL_FROM ?? process.env.SMTP_USER;

  try {
    await transport.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
  } catch (err) {
    // Log but don't rethrow — callers already use .catch(() => undefined)
    // for best-effort sends; a hard throw here would crash the action.
    console.error(`[email:send-failed] to=${params.to} subject="${params.subject}"`, err);
  }
}
