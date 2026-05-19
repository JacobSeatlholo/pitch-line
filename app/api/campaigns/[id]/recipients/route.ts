import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { supabaseAdmin } from "../../../../../lib/supabase";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
  const { data: contact } = await supabaseAdmin.from("contacts").upsert({ user_id: session.user.email, email }, { onConflict: "user_id,email" }).select().single();
  if (!contact) return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
  const { error } = await supabaseAdmin.from("campaign_recipients").insert({ campaign_id: params.id, contact_id: contact.id, email, tracking_id: nanoid(16), status: "pending" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
