// Placeholder email sender — no email provider is configured yet (see plan:
// 2FA/backup-email codes are wired end-to-end, but real delivery is left for
// later). Logs to the server console so the flow is testable in dev.
export async function sendEmail(params: { to: string; subject: string; text: string }): Promise<void> {
  console.log(`[email:placeholder] to=${params.to} subject="${params.subject}" text="${params.text}"`);
}
