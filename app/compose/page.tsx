"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";

interface SendAsAlias { sendAsEmail: string; displayName?: string; }
interface Contact { email: string; first_name?: string; last_name?: string; company?: string; [key: string]: string | undefined; }

export default function ComposePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [aliases, setAliases] = useState<SendAsAlias[]>([]);
  const [form, setForm] = useState({ name: "", subject: "", bodyHtml: "", fromEmail: "", fromName: "" });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  useEffect(() => {
    if (!session?.accessToken) return;
    fetch("/api/campaigns/aliases")
      .then((r) => r.json())
      .then((data) => {
        setAliases(data.aliases ?? []);
        if (data.aliases?.[0]) {
          setForm((f) => ({
            ...f,
            fromEmail: data.aliases[0].sendAsEmail,
            fromName: data.aliases[0].displayName ?? "",
          }));
        }
      });
  }, [session]);

  function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setContacts((result.data as Contact[]).filter((r) => r.email));
      },
    });
  }

  async function saveDraft() {
    if (!form.subject || contacts.length === 0) {
      setError("Subject and at least one contact required");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, contacts }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed to save campaign"); setSaving(false); return; }
    router.push(`/campaigns/${data.campaign.id}`);
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const inputStyle = { width: "100%", background: "#0d0d0d", border: "1px solid #222", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" as const, outline: "none" };
  const labelStyle = { fontSize: 12, color: "#555", textTransform: "uppercase" as const, letterSpacing: "0.08em", display: "block", marginBottom: 6 };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
      <nav style={{ borderBottom: "1px solid #1a1a1a", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 13 }}>← Dashboard</button>
        <span style={{ fontWeight: 700, fontSize: 16 }}>New Campaign</span>
        <button onClick={saveDraft} disabled={saving || !form.subject || contacts.length === 0} style={{ background: "#fff", color: "#000", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.5 : 1 }}>
          {saving ? "Saving..." : "Save & Review →"}
        </button>
      </nav>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 32px", display: "flex", flexDirection: "column", gap: 28 }}>
        {error && <div style={{ background: "#1a0000", border: "1px solid #440000", borderRadius: 8, padding: 12, color: "#ff6b6b", fontSize: 13 }}>{error}</div>}

        <div>
          <label style={labelStyle}>Campaign name</label>
          <input style={inputStyle} placeholder="e.g. October outreach" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>

        <div>
          <label style={labelStyle}>Send as</label>
          <select style={{ ...inputStyle }} value={form.fromEmail} onChange={(e) => {
            const alias = aliases.find((a) => a.sendAsEmail === e.target.value);
            set("fromEmail", e.target.value);
            if (alias?.displayName) set("fromName", alias.displayName);
          }}>
            {aliases.map((a) => (
              <option key={a.sendAsEmail} value={a.sendAsEmail}>
                {a.displayName ? `${a.displayName} <${a.sendAsEmail}>` : a.sendAsEmail}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Subject line</label>
          <input style={inputStyle} placeholder="Hi {{first_name}}, quick question..." value={form.subject} onChange={(e) => set("subject", e.target.value)} />
          <p style={{ fontSize: 11, color: "#444", marginTop: 6 }}>Use {"{{first_name}}"}, {"{{company}}"} for personalisation</p>
        </div>

        <div>
          <label style={labelStyle}>Email body (HTML supported)</label>
          <textarea style={{ ...inputStyle, minHeight: 280, resize: "vertical", lineHeight: 1.6 }}
            placeholder={`<p>Hi {{first_name}},</p>\n<p>Your message here...</p>`}
            value={form.bodyHtml} onChange={(e) => set("bodyHtml", e.target.value)} />
        </div>

        <div>
          <label style={labelStyle}>Recipients (CSV)</label>
          <div style={{ border: "1px dashed #222", borderRadius: 8, padding: 24, textAlign: "center", cursor: "pointer" }} onClick={() => fileRef.current?.click()}>
            {contacts.length > 0 ? (
              <span style={{ color: "#1a7f37", fontWeight: 600 }}>{contacts.length} contacts loaded</span>
            ) : (
              <span style={{ color: "#555", fontSize: 14 }}>Click to upload CSV<br /><span style={{ fontSize: 12 }}>Required: email · Optional: first_name, last_name, company</span></span>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleCSV} />
          {contacts.length > 0 && (
            <div style={{ marginTop: 12, background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                    {["Email", "First name", "Company"].map((h) => (
                      <th key={h} style={{ padding: "8px 14px", textAlign: "left", color: "#444", fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contacts.slice(0, 5).map((c, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #111" }}>
                      <td style={{ padding: "8px 14px", color: "#888" }}>{c.email}</td>
                      <td style={{ padding: "8px 14px", color: "#888" }}>{c.first_name ?? "-"}</td>
                      <td style={{ padding: "8px 14px", color: "#888" }}>{c.company ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {contacts.length > 5 && <div style={{ padding: "8px 14px", color: "#444", fontSize: 11 }}>+{contacts.length - 5} more</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
