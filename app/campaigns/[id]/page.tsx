"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type { Campaign, CampaignRecipient } from "../../../types";

export default function CampaignDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  function loadCampaign() {
    if (!id || status !== "authenticated") return;
    fetch(`/api/campaigns/${id}`)
      .then((r) => r.json())
      .then(({ campaign, recipients }) => {
        setCampaign(campaign);
        setRecipients(recipients ?? []);
      });
  }

  useEffect(() => { loadCampaign(); }, [id, status]);

  async function addRecipient() {
    if (!addEmail) return;
    setAdding(true);
    const res = await fetch(`/api/campaigns/${id}/recipients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: addEmail }),
    });
    if (res.ok) { setAddEmail(""); setShowAdd(false); loadCampaign(); }
    else { const d = await res.json(); setError(d.error ?? "Failed to add"); }
    setAdding(false);
  }

  async function launchCampaign() {
    setSending(true);
    setError("");
    const res = await fetch("/api/campaigns/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId: id }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Send failed"); setSending(false); return; }
    loadCampaign();
    setSending(false);
  }

  function exportCSV() {
    if (!recipients.length) return;
    const rows = [
      ["Email", "Status", "Sent at", "Opened at", "Clicked at"].join(","),
      ...recipients.map((r) => [r.email, r.status, r.sent_at ?? "", r.opened_at ?? "", r.clicked_at ?? ""].join(",")),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rows], { type: "text/csv" }));
    a.download = `${campaign?.name ?? "campaign"}-results.csv`;
    a.click();
  }

  const statusColor: Record<string, string> = {
    pending: "#555", sent: "#666", opened: "#d4a200",
    clicked: "#1a7f37", bounced: "#cc3333", unsubscribed: "#444"
  };

  if (!campaign) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f", color: "#555" }}>
      Loading...
    </div>
  );

  const openRate = campaign.sent_count > 0 ? ((campaign.open_count / campaign.sent_count) * 100).toFixed(1) : "0";
  const clickRate = campaign.sent_count > 0 ? ((campaign.click_count / campaign.sent_count) * 100).toFixed(1) : "0";

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
      <nav style={{ borderBottom: "1px solid #1a1a1a", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 13 }}>← Dashboard</button>
        <span style={{ fontWeight: 700, fontSize: 16 }}>{campaign.name}</span>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={exportCSV} style={{ background: "none", border: "1px solid #222", color: "#aaa", borderRadius: 8, padding: "7px 16px", fontSize: 13, cursor: "pointer" }}>Export CSV</button>
          {campaign.status === "draft" && (
            <button onClick={launchCampaign} disabled={sending} style={{ background: "#fff", color: "#000", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: sending ? 0.6 : 1 }}>
              {sending ? "Sending..." : `Launch to ${recipients.length} contacts →`}
            </button>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 32px" }}>
        {error && <div style={{ background: "#1a0000", border: "1px solid #440000", borderRadius: 8, padding: 12, color: "#ff6b6b", fontSize: 13, marginBottom: 24 }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 40 }}>
          {[
            { label: "Recipients", value: campaign.total_recipients },
            { label: "Sent", value: campaign.sent_count },
            { label: "Opens", value: campaign.open_count },
            { label: "Open rate", value: `${openRate}%` },
            { label: "Click rate", value: `${clickRate}%` },
          ].map((s) => (
            <div key={s.label} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "18px 16px" }}>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Recipients ({recipients.length})</span>
            {campaign.status === "draft" && (
              <button onClick={() => setShowAdd(!showAdd)} style={{ background: "none", border: "1px solid #333", color: "#aaa", borderRadius: 8, padding: "5px 14px", fontSize: 12, cursor: "pointer" }}>
                + Add recipient
              </button>
            )}
          </div>

          {showAdd && (
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #1a1a1a", display: "flex", gap: 10, alignItems: "center" }}>
              <input type="email" placeholder="email@example.com" value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRecipient()}
                style={{ flex: 1, background: "#0d0d0d", border: "1px solid #333", borderRadius: 8, padding: "8px 14px", color: "#fff", fontSize: 13, outline: "none" }} />
              <button onClick={addRecipient} disabled={adding || !addEmail} style={{ background: "#fff", color: "#000", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {adding ? "Adding..." : "Add"}
              </button>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 13 }}>Cancel</button>
            </div>
          )}

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                {["Email", "Status", "Sent", "Opened", "Clicked"].map((h) => (
                  <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, color: "#444", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recipients.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #111" }}>
                  <td style={{ padding: "12px 20px", fontSize: 13 }}>{r.email}</td>
                  <td style={{ padding: "12px 20px" }}>
                    <span style={{ fontSize: 11, background: statusColor[r.status] + "22", color: statusColor[r.status], padding: "3px 10px", borderRadius: 20, textTransform: "capitalize", fontWeight: 600 }}>{r.status}</span>
                  </td>
                  <td style={{ padding: "12px 20px", fontSize: 12, color: "#555" }}>{r.sent_at ? new Date(r.sent_at).toLocaleTimeString("en-ZA") : "-"}</td>
                  <td style={{ padding: "12px 20px", fontSize: 12, color: "#555" }}>{r.opened_at ? new Date(r.opened_at).toLocaleTimeString("en-ZA") : "-"}</td>
                  <td style={{ padding: "12px 20px", fontSize: 12, color: "#555" }}>{r.clicked_at ? new Date(r.clicked_at).toLocaleTimeString("en-ZA") : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
// cache bust Wed May 20 16:18:58 SAST 2026
