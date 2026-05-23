-- ============================================================
-- POWERVITA BOT — Tablas de Supabase
-- Ejecutar en: Supabase > SQL Editor > New query > Run
-- ============================================================

-- Tabla de conversaciones (historial de chat)
CREATE TABLE IF NOT EXISTS conversations (
  phone           TEXT PRIMARY KEY,
  history         JSONB    DEFAULT '[]',
  transferred     BOOLEAN  DEFAULT FALSE,
  purchased       BOOLEAN  DEFAULT FALSE,
  opted_out       BOOLEAN  DEFAULT FALSE,
  retries         INTEGER  DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de leads (clientes potenciales)
CREATE TABLE IF NOT EXISTS leads (
  phone           TEXT PRIMARY KEY,
  name            TEXT,
  country         TEXT,
  lang            TEXT,
  status          TEXT DEFAULT 'new',
  last_objective  TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_leads_country ON leads(country);
CREATE INDEX IF NOT EXISTS idx_leads_status  ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_updated ON leads(updated_at);
CREATE INDEX IF NOT EXISTS idx_conv_updated  ON conversations(updated_at);
