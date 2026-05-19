import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabase";

// 1x1 transparent GIF
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

export async function GET(req: NextRequest) {
  const tid = req.nextUrl.searchParams.get("tid");

  if (tid) {
    const { data: recipient } = await supabaseAdmin
      .from("campaign_recipients")
      .select("id, campaign_id, status")
      .eq("tracking_id", tid)
      .single();

    if (recipient) {
      // Only count first open
      if (recipient.status === "sent") {
        await supabaseAdmin.from("campaign_recipients").update({
          status: "opened",
          opened_at: new Date().toISOString(),
        }).eq("id", recipient.id);

        await supabaseAdmin.from("campaigns")
          .update({ open_count: supabaseAdmin.rpc("increment", { x: 1 }) })
          .eq("id", recipient.campaign_id);
      }

      await supabaseAdmin.from("tracking_events").insert({
        tracking_id: tid,
        campaign_id: recipient.campaign_id,
        event_type: "open",
        ip: req.headers.get("x-forwarded-for") ?? "",
        user_agent: req.headers.get("user-agent") ?? "",
      });
    }
  }

  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
