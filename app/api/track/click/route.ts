import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const tid = req.nextUrl.searchParams.get("tid");
  const url = req.nextUrl.searchParams.get("url");

  if (!url) return NextResponse.redirect("/");

  const destination = decodeURIComponent(url);

  if (tid) {
    const { data: recipient } = await supabaseAdmin
      .from("campaign_recipients")
      .select("id, campaign_id")
      .eq("tracking_id", tid)
      .single();

    if (recipient) {
      await supabaseAdmin.from("campaign_recipients").update({
        status: "clicked",
        clicked_at: new Date().toISOString(),
      }).eq("id", recipient.id);

      await supabaseAdmin.from("tracking_events").insert({
        tracking_id: tid,
        campaign_id: recipient.campaign_id,
        event_type: "click",
        url: destination,
        ip: req.headers.get("x-forwarded-for") ?? "",
        user_agent: req.headers.get("user-agent") ?? "",
      });
    }
  }

  return NextResponse.redirect(destination);
}
