import { google } from "googleapis";

export function getGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth });
}

export function injectTracking(
  html: string,
  trackingId: string,
  appUrl: string
): string {
  // Wrap all links with click tracking
  const trackedHtml = html.replace(
    /<a\s+([^>]*?)href="([^"]+)"([^>]*?)>/gi,
    (match, before, url, after) => {
      if (url.startsWith("mailto:") || url.startsWith("#")) return match;
      const encoded = encodeURIComponent(url);
      return `<a ${before}href="${appUrl}/api/track/click?tid=${trackingId}&url=${encoded}"${after}>`;
    }
  );

  // Append open tracking pixel
  const pixel = `<img src="${appUrl}/api/track/open?tid=${trackingId}" width="1" height="1" style="display:none" alt="" />`;
  return trackedHtml + pixel;
}

export function personalise(template: string, fields: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => fields[key] ?? "");
}

export async function sendEmail({
  gmail,
  from,
  to,
  subject,
  html,
}: {
  gmail: ReturnType<typeof getGmailClient>;
  from: string;
  to: string;
  subject: string;
  html: string;
}) {
  const raw = Buffer.from(
    [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      'Content-Type: text/html; charset="UTF-8"',
      "",
      html,
    ].join("\r\n")
  )
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });

  return res.data;
}

// Fetch all "Send As" aliases from Gmail settings
export async function getSendAsAliases(accessToken: string) {
  const gmail = getGmailClient(accessToken);
  const res = await gmail.users.settings.sendAs.list({ userId: "me" });
  return res.data.sendAs ?? [];
}
