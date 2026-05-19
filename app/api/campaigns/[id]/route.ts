import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: campaign } = await supabaseAdmin.from("campaigns").select("*").eq("id", params.id).single();
  const { data: recipients } = await supabaseAdmin.from("campaign_recipients").select("*").eq("campaign_id", params.id);
  return NextResponse.json({ campaign, recipients: recipients ?? [] });
}
