"use client";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#0a0a0f",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{
          fontSize: 13,
          letterSpacing: "0.2em",
          color: "#666",
          textTransform: "uppercase",
          marginBottom: 16,
        }}>Business Hustle</div>
        <h1 style={{
          fontSize: 48,
          fontWeight: 700,
          color: "#fff",
          margin: "0 0 8px",
          letterSpacing: "-0.02em",
        }}>Pitchline</h1>
        <p style={{ color: "#555", fontSize: 15, margin: "0 0 48px" }}>
          Mail merge & campaign tracking for Google Workspace
        </p>
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "#fff",
            color: "#111",
            border: "none",
            borderRadius: 10,
            padding: "14px 28px",
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
            margin: "0 auto",
            width: "100%",
            justifyContent: "center",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
          </svg>
          Sign in with Google
        </button>
        <p style={{ color: "#333", fontSize: 12, marginTop: 24, lineHeight: 1.6 }}>
          Pitchline requires Gmail access to send on your behalf.<br />
          Your credentials are never stored.
        </p>
      </div>
    </div>
  );
}
