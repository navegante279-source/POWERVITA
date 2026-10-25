// Webhook de Mercado Pago: cuando un pago de Power Vita queda aprobado
//  1. avisa a Andrés por WhatsApp con los datos de envío
//  2. confirma al cliente por WhatsApp (si tiene la ventana de 24h abierta)
//  3. manda el evento Purchase a Meta (Conversions API) — mismo event_id que el pixel de /gracias.html
//  4. marca el lead como vendido en Supabase (corta los seguimientos del bot)
//
// Variables en Vercel: MP_ACCESS_TOKEN, META_CAPI_TOKEN, WHATSAPP_TOKEN, WHATSAPP_PHONE_ID,
//                      OWNER_PHONE, SUPABASE_URL, SUPABASE_KEY

import crypto from "crypto";
import { PRODUCTOS_UY } from "./pagar.js";

const PIXEL_ID = "2212676212813152";
const sha = (s) => crypto.createHash("sha256").update(String(s).trim().toLowerCase()).digest("hex");

// 099123456 → 59899123456 (formato WhatsApp)
function telUY(t) {
  let d = String(t || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("0")) d = d.slice(1);
  if (!d.startsWith("598")) d = "598" + d;
  return d;
}

async function sendWA(to, text) {
  const { WHATSAPP_TOKEN, WHATSAPP_PHONE_ID } = process.env;
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID || !to) return null;
  try {
    const r = await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
    });
    return await r.json();
  } catch { return null; }
}

async function supabase(path, init = {}) {
  const { SUPABASE_URL, SUPABASE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

// true si es la primera vez que vemos este pago (MP manda la misma notificación varias veces).
// Si la tabla pagos_mp no existe todavía, procesa igual (puede duplicar avisos).
async function primeraVez(pago) {
  const r = await supabase("pagos_mp", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify({
      id: pago.id,
      monto: pago.transaction_amount,
      referencia: pago.external_reference,
      telefono: pago.metadata?.telefono || null,
      aprobado_at: pago.date_approved,
    }),
  });
  if (!r || !r.ok) return true;
  const rows = await r.json().catch(() => []);
  return Array.isArray(rows) && rows.length > 0;
}

function describirItems(ref) {
  // pv|vitax1,thermox2|tel|origen|ts
  const parte = String(ref || "").split("|")[1] || "";
  return parte.split(",").filter(Boolean).map(x => {
    const [prod, q] = x.split("x");
    return `${q} × ${PRODUCTOS_UY[prod] || prod}`;
  });
}

export default async function handler(req, res) {
  // MP espera 200/201 rápido; si falla el procesamiento reintenta solo
  const q = req.query || {};
  const b = req.body || {};
  const tipo = b.type || q.type || q.topic;
  const id = b.data?.id || q["data.id"] || q.id;

  if (tipo !== "payment" || !id) return res.status(200).json({ ignorado: true });
  if (!process.env.MP_ACCESS_TOKEN) return res.status(500).end();

  try {
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });
    const pago = await r.json();
    if (!r.ok) return res.status(200).json({ error: pago.message });

    const ref = pago.external_reference || "";
    if (!ref.startsWith("pv|")) return res.status(200).json({ ignorado: "no es de Power Vita" });
    if (pago.status !== "approved") return res.status(200).json({ status: pago.status });
    if (!(await primeraVez(pago))) return res.status(200).json({ duplicado: true });

    const m = pago.metadata || {};
    const origen = ref.split("|")[3] || "";
    const tel = telUY(m.telefono || ref.split("|")[2]);
    const items = describirItems(ref);
    const monto = pago.transaction_amount;
    const email = pago.payer?.email || "";

    // 1. Aviso a Andrés
    const OWNER = process.env.OWNER_PHONE;
    await sendWA(OWNER,
      `💰 PAGO APROBADO — Power Vita\n\n` +
      `${items.join("\n")}\n` +
      `💵 $${monto.toLocaleString("es-UY")} UYU · MP #${pago.id}\n` +
      `📍 Origen: ${origen === "bot" ? "link del bot de WhatsApp" : "landing"}\n\n` +
      `👤 ${m.nombre || pago.payer?.first_name || "Sin nombre"}\n` +
      (tel ? `📱 wa.me/${tel}\n` : "") +
      (m.direccion ? `🏠 ${m.direccion}${m.departamento ? `, ${m.departamento}` : ""}\n` : "🏠 Sin dirección — pedírsela por WhatsApp\n") +
      (email ? `✉️ ${email}\n` : "") +
      `\n🚚 Despachar a partir de 72 hs del pago.`
    );

    // 2. Confirmación al cliente (solo llega si escribió al WhatsApp en las últimas 24h)
    if (tel) {
      await sendWA(tel,
        `¡Recibimos tu pago! 🙌 Gracias${m.nombre ? ` ${m.nombre.split(" ")[0]}` : ""}.\n\n` +
        `${items.join("\n")}\n\n` +
        `🚚 El envío sale a partir de las 72 hs de confirmado el pago.` +
        (m.direccion ? "" : `\n\nPasame por acá tu nombre completo, dirección y departamento para el envío 📦`)
      );
    }

    // 3. Purchase a Meta (CAPI)
    if (process.env.META_CAPI_TOKEN) {
      const user_data = { country: [sha("uy")] };
      if (tel) user_data.ph = [sha(tel)];
      if (email) user_data.em = [sha(email)];
      await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [{
            event_name: "Purchase",
            event_time: Math.floor(new Date(pago.date_approved || Date.now()).getTime() / 1000),
            event_id: `mp_${pago.id}`,
            action_source: "website",
            event_source_url: "https://powervita.vercel.app/",
            user_data,
            custom_data: { currency: "UYU", value: monto, content_type: "product", num_items: items.length },
          }],
          access_token: process.env.META_CAPI_TOKEN,
        }),
      }).catch(() => {});
    }

    // 4. Lead vendido → el bot deja de hacerle seguimiento
    if (tel) {
      await Promise.all([
        supabase(`leads?phone=eq.${tel}`, { method: "PATCH", body: JSON.stringify({ status: "sold", updated_at: new Date().toISOString() }) }),
        supabase(`conversations?phone=eq.${tel}`, { method: "PATCH", body: JSON.stringify({ purchased: true }) }),
      ]).catch(() => {});
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("mp-webhook error:", e.message);
    return res.status(500).json({ error: e.message });
  }
}
