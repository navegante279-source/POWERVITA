-- ============================================================
-- POWERVITA — Migración: app /app (seguimiento web y despacho)
-- Ejecutar en: Supabase > SQL Editor > New query > Run
-- Es aditiva y segura (no borra ni modifica datos existentes).
-- ============================================================

-- Pasos de cada visita a la web. Los que no compran se borran solos a los 90 días (api/panel.js).
CREATE TABLE IF NOT EXISTS seg_eventos (
  id         BIGSERIAL PRIMARY KEY,
  sid        TEXT NOT NULL,            -- id al azar de la visita, no identifica a la persona
  paso       TEXT NOT NULL,            -- ping, visita, carrito, datos, whatsapp, pago, compra
  prod       TEXT,
  origen     TEXT,                     -- utm_content (anuncio)
  disp       TEXT,                     -- celular / computadora
  valor      NUMERIC,
  nombre     TEXT,                     -- solo al tocar Pagar
  telefono   TEXT,                     -- solo al tocar Pagar
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_seg_created ON seg_eventos(created_at);
CREATE INDEX IF NOT EXISTS idx_seg_sid ON seg_eventos(sid);

-- Qué pedidos ya se despacharon (el pago sigue viviendo en Mercado Pago).
CREATE TABLE IF NOT EXISTS pedidos_despacho (
  pago_id       BIGINT PRIMARY KEY,
  despachado_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guardan nombre y teléfono: nadie las lee con la clave pública. El panel usa la clave del servidor.
-- Si SUPABASE_KEY fuera la clave anon, el panel no podría leerlas: ahí hay que cambiarla por la service_role.
ALTER TABLE seg_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_despacho ENABLE ROW LEVEL SECURITY;
