import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { supabaseAdmin } from "../../../lib/supabase";
import { nanoid } from "nanoid";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await supabaseAdmin.from("campaigns").select("*").eq("user_id", session.user.email).order("created_at", { ascending: false });
  return NextResponse.json({ campaigns: data ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, subject, bodyHtml, fromName, fromEmail, contacts } = await req.json();
  const { data: campaign, error } = await supabaseAdmin.from("campaigns").insert({
    user_id: session.user.email, name: name || "Untitled campaign",
    subject, body_html: bodyHtml, from_name: fromName, from_email: fromEmail,
    status: "draft", total_recipients: contacts?.length ?? 0,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  for (const c of (contacts ?? [])) {
    const { data: contact } = await supabaseAdmin.from("contacts")
      .upsert({ user_id: session.user.email, email: c.email, first_name: c.first_name ?? null, last_name: c.last_name ?? null, company: c.company ?? null, custom_fields: {} }, { onConflict: "user_id,email" })
      .select().single();
    if (contact) await supabaseAdmin.from("campaign_recipients").insert({ campaign_id: campaign.id, contact_id: contact.id, email: c.email, tracking_id: nanoid(16), status: "pending" });
  }
  return NextResponse.json({ campaign });
}
