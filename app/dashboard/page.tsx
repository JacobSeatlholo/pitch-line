"use client";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Campaign } from "../../types";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data) => { setCampaigns(data.campaigns ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [status]);

  const totalSent = campaigns.reduce((a, c) => a + (c.sent_count ?? 0), 0);
  const totalOpens = campaigns.reduce((a, c) => a + (c.open_count ?? 0), 0);
  const totalClicks = campaigns.reduce((a, c) => a + (c.click_count ?? 0), 0);
  const avgOpenRate = totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) : "0";

  const statusColor: Record<string, string> = {
    draft: "#444", sending: "#d4a200", sent: "#1a7f37", paused: "#666",
  };

  if (status === "loading" || loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f" }}>
      <p style={{ color: "#555" }}>Loading...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
      <nav style={{ borderBottom: "1px solid #1a1a1a", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.01em" }}>Pitchline</span>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <button onClick={() => router.push("/compose")} style={{ background: "#fff", color: "#000", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            + New Campaign
          </button>
          <button onClick={() => signOut({ callbackUrl: "/login" })} style={{ background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer" }}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 48 }}>
          {[
            { label: "Total sent", value: totalSent.toLocaleString() },
            { label: "Total opens", value: totalOpens.toLocaleString() },
            { label: "Avg open rate", value: `${avgOpenRate}%` },
            { label: "Total clicks", value: totalClicks.toLocaleString() },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: "24px 20px" }}>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #1a1a1a" }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Campaigns</span>
          </div>
          {campaigns.length === 0 ? (
            <div style={{ padding: "60px 24px", textAlign: "center", color: "#444" }}>
              No campaigns yet.{" "}
              <button onClick={() => router.push("/compose")} style={{ color: "#fff", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                Create your first one.
              </button>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                  {["Campaign", "Status", "Sent", "Opens", "Clicks", "Open rate", "Date"].map((h) => (
                    <th key={h} style={{ padding: "12px 24px", textAlign: "left", fontSize: 11, color: "#444", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const openRate = c.sent_count > 0 ? ((c.open_count / c.sent_count) * 100).toFixed(1) : "0";
                  return (
                    <tr key={c.id} style={{ borderBottom: "1px solid #151515", cursor: "pointer" }}
                      onClick={() => router.push(`/campaigns/${c.id}`)}>
                      <td style={{ padding: "16px 24px", fontWeight: 500, fontSize: 14 }}>{c.name}</td>
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{ fontSize: 11, background: statusColor[c.status] + "22", color: statusColor[c.status], padding: "3px 10px", borderRadius: 20, textTransform: "capitalize", fontWeight: 600 }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: "16px 24px", color: "#888", fontSize: 14 }}>{c.sent_count}</td>
                      <td style={{ padding: "16px 24px", color: "#888", fontSize: 14 }}>{c.open_count}</td>
                      <td style={{ padding: "16px 24px", color: "#888", fontSize: 14 }}>{c.click_count}</td>
                      <td style={{ padding: "16px 24px", color: "#888", fontSize: 14 }}>{openRate}%</td>
                      <td style={{ padding: "16px 24px", color: "#555", fontSize: 12 }}>{new Date(c.created_at).toLocaleDateString("en-ZA")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
