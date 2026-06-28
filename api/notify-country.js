export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { country, message } = req.body || {};
  if (!country) return res.status(400).json({ error: "country required" });

  const token   = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const owner   = process.env.NOTIFY_PHONE || process.env.OWNER_PHONE;

  if (!token || !phoneId || !owner) {
    return res.status(200).json({ ok: true, skipped: "WhatsApp vars not set" });
  }

  const text = message
    ? `🌍 *Nueva consulta desde ${country}*\n\n"${message}"\n\n_Power Vita — Vita Advisor IA_`
    : `🌍 *Nueva consulta desde ${country}*\n\n_Power Vita — Vita Advisor IA_`;

  try {
    await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: owner,
        type: "text",
        text: { body: text }
      })
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
