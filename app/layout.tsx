import type { Metadata } from "next";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pitchline — Mail Merge & Campaign Tracking",
  description: "Gmail-powered mail merge and campaign tracking by Business Hustle",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
