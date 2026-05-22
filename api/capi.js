import crypto from "crypto";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { phone, product, country, password } = req.body || {};

  if (!process.env.ADMIN_PASSWORD)
    return res.status(401).json({ error: "ADMIN_PASSWORD no está configurada en Vercel. Agregala en Settings → Environment Variables y redeployá." });
  if (password !== process.env.ADMIN_PASSWORD)
    return res.status(401).json({ error: "Contraseña incorrecta. Verificá que coincida exactamente con ADMIN_PASSWORD en Vercel." });

  if (!phone || !product)
    return res.status(400).json({ error: "Teléfono y producto son obligatorios" });

  if (!process.env.META_CAPI_TOKEN)
    return res.status(500).json({ error: "META_CAPI_TOKEN no configurado en Vercel" });

  // Normalize & hash phone (E.164 format without +)
  const normalized = phone.replace(/\D/g, "");
  const hashed = crypto.createHash("sha256").update(normalized).digest("hex");

  const eventId = `Purchase_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

  const payload = {
    data: [{
      event_name: "Purchase",
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: "other",
      user_data: { ph: [hashed] },
      custom_data: {
        content_name: product,
        content_type: "product",
        currency: "USD",
        value: 1,
        ...(country && { country }),
      },
    }],
    access_token: process.env.META_CAPI_TOKEN,
    test_event_code: "TEST90705",
  };

  try {
    const r = await fetch(
      `https://graph.facebook.com/v19.0/2212676212813152/events`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
    );
    const data = await r.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    return res.status(200).json({ ok: true, received: data.events_received });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
