-- ============================================================
-- POWERVITA BOT — Migración opcional: origen del lead
-- Ejecutar en: Supabase > SQL Editor > New query > Run
-- Es aditiva y segura (no borra ni modifica datos existentes).
-- ============================================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS source TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);

-- 'source' guarda el tag [ref:...] que la landing agrega a cada CTA de WhatsApp
-- (ej: "hero", "footer", "Modal_Vita_Xtra_T+_Comprar", "StickyBar", "FloatingBtn").
-- Hoy el bot solo te avisa el origen por WhatsApp al owner (no lo persiste).
-- Una vez corrida esta migración, se puede sumar en bot/index.js:
--   await saveLead(phone, { ...otros campos..., source: landingRef || undefined });
-- dentro del bloque "NUEVO LEAD" de handleMessage, para poder reportar
-- qué sección de la landing genera más ventas.
