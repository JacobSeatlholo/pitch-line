import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { getSendAsAliases } from "../../../../lib/gmail";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const aliases = await getSendAsAliases(session.accessToken);
  return NextResponse.json({ aliases });
}
