-- PowerVita WhatsApp Bot — Database Migration
-- Run this in the Supabase SQL Editor before deploying the WhatsApp bot.

-- Add follow-up tracking column to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS followup_sent_at TIMESTAMPTZ;

-- Add customer name (extracted from conversation context)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Add bot name (deterministic per phone, stored for follow-up consistency)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS bot_name TEXT;

-- Optional: add an index on last_message_at for efficient follow-up queries
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at
  ON conversations (last_message_at);

-- Optional: add an index on transferred + followup_sent_at for the cron query
CREATE INDEX IF NOT EXISTS idx_conversations_followup
  ON conversations (transferred, followup_sent_at, last_message_at);
