-- ============================================
-- PITCHLINE — Supabase Schema
-- Run in: Supabase Dashboard > SQL Editor
-- ============================================

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft | sending | sent | paused
  total_recipients INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  open_count INT DEFAULT 0,
  click_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email)
);

-- Campaign recipients (one row per contact per campaign)
CREATE TABLE campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending | sent | opened | clicked | bounced | unsubscribed
  tracking_id TEXT UNIQUE NOT NULL,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  gmail_message_id TEXT
);

-- Tracking events log
CREATE TABLE tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id TEXT NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- open | click
  url TEXT, -- for click events
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_campaign_recipients_tracking_id ON campaign_recipients(tracking_id);
CREATE INDEX idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX idx_tracking_events_tracking_id ON tracking_events(tracking_id);
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_contacts_user_id ON contacts(user_id);

-- RLS (enable after testing)
-- ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
