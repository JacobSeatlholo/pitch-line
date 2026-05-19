import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { supabaseAdmin } from "../../../../lib/supabase";
import { getGmailClient, sendEmail, injectTracking, personalise } from "../../../../lib/gmail";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId } = await req.json();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const { data: campaign } = await supabaseAdmin.from("campaigns").select("*").eq("id", campaignId).single();
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const { data: recipients } = await supabaseAdmin.from("campaign_recipients").select("*, contacts(*)").eq("campaign_id", campaignId).eq("status", "pending");
  if (!recipients?.length) return NextResponse.json({ error: "No pending recipients" }, { status: 400 });

  const gmail = getGmailClient(session.accessToken);
  let sent = 0;

  await supabaseAdmin.from("campaigns").update({ status: "sending" }).eq("id", campaignId);

  for (const recipient of recipients) {
    try {
      const contact = recipient.contacts as Record<string, string> ?? {};
      const trackingId = recipient.tracking_id ?? nanoid(16);
      const personalised = personalise(campaign.body_html, {
        first_name: contact.first_name ?? "", last_name: contact.last_name ?? "",
        company: contact.company ?? "", email: recipient.email,
      });
      const trackedHtml = injectTracking(personalised, trackingId, appUrl);
      const result = await sendEmail({
        gmail, from: `${campaign.from_name} <${campaign.from_email}>`,
        to: recipient.email,
        subject: personalise(campaign.subject, { first_name: contact.first_name ?? "", company: contact.company ?? "" }),
        html: trackedHtml,
      });
      await supabaseAdmin.from("campaign_recipients").update({
        status: "sent", sent_at: new Date().toISOString(),
        tracking_id: trackingId, gmail_message_id: result.id,
      }).eq("id", recipient.id);
      sent++;
      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      console.error(`Failed to send to ${recipient.email}:`, err);
      await supabaseAdmin.from("campaign_recipients").update({ status: "bounced" }).eq("id", recipient.id);
    }
  }

  await supabaseAdmin.from("campaigns").update({ status: "sent", sent_count: sent, sent_at: new Date().toISOString() }).eq("id", campaignId);
  return NextResponse.json({ success: true, sent });
}
