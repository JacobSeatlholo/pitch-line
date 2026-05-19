import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";

const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

export async function GET(req: NextRequest) {
  const tid = req.nextUrl.searchParams.get("tid");
  if (tid) {
    const { data: recipient } = await supabaseAdmin.from("campaign_recipients").select("id, campaign_id, status").eq("tracking_id", tid).single();
    if (recipient && recipient.status === "sent") {
      await supabaseAdmin.from("campaign_recipients").update({ status: "opened", opened_at: new Date().toISOString() }).eq("id", recipient.id);
    }
    if (recipient) {
      await supabaseAdmin.from("tracking_events").insert({ tracking_id: tid, campaign_id: recipient.campaign_id, event_type: "open", ip: req.headers.get("x-forwarded-for") ?? "", user_agent: req.headers.get("user-agent") ?? "" });
    }
  }
  return new NextResponse(PIXEL, { headers: { "Content-Type": "image/gif", "Cache-Control": "no-store" } });
}
