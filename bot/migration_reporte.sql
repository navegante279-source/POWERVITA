-- ============================================================
-- POWERVITA — Migración: pagos Mercado Pago + reporte de campaña
-- Ejecutar en: Supabase > SQL Editor > New query > Run
-- Es aditiva y segura (no borra ni modifica datos existentes).
-- ============================================================

-- Pagos aprobados de Mercado Pago (api/mp-webhook.js).
-- Evita avisos duplicados: MP manda la misma notificación varias veces.
CREATE TABLE IF NOT EXISTS pagos_mp (
  id          BIGINT PRIMARY KEY,           -- id del pago en Mercado Pago
  monto       NUMERIC,
  referencia  TEXT,                         -- pv|productos|telefono|origen|ts
  telefono    TEXT,
  aprobado_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Fecha de alta del lead, para contar "contactos nuevos hoy" en el reporte.
-- Los leads existentes quedan con la fecha de hoy (no hay forma de saber la real).
ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);

-- Origen del lead (sección de la landing) — ver migration_add_source.sql
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source TEXT;
