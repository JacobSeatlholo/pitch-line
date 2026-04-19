export type CampaignStatus = "draft" | "sending" | "sent" | "paused";
export type RecipientStatus = "pending" | "sent" | "opened" | "clicked" | "bounced" | "unsubscribed";

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  subject: string;
  body_html: string;
  from_name: string;
  from_email: string;
  status: CampaignStatus;
  total_recipients: number;
  sent_count: number;
  open_count: number;
  click_count: number;
  created_at: string;
  sent_at: string | null;
}

export interface Contact {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  custom_fields: Record<string, string>;
  created_at: string;
}

export interface CampaignRecipient {
  id: string;
  campaign_id: string;
  contact_id: string;
  email: string;
  status: RecipientStatus;
  tracking_id: string;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  gmail_message_id: string | null;
}

export interface TrackingEvent {
  id: string;
  tracking_id: string;
  campaign_id: string;
  event_type: "open" | "click";
  url: string | null;
  ip: string;
  user_agent: string;
  created_at: string;
}

// NextAuth session extension
declare module "next-auth" {
  interface Session {
    accessToken: string;
    refreshToken: string;
  }
}
