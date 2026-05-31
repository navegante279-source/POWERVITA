export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { password } = req.body || {};
  if (!process.env.ADMIN_PASSWORD) return res.status(500).json({ error: "ADMIN_PASSWORD no configurada" });
  if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: "Contraseña incorrecta" });

  const { SUPABASE_URL, SUPABASE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ error: "Supabase no configurado" });

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/clicks?select=country,phone,created_at&order=created_at.desc&limit=100`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const clicks = await r.json();
    if (!Array.isArray(clicks)) return res.status(500).json({ error: "Error leyendo clicks" });

    const byCountry = {};
    for (const c of clicks) {
      byCountry[c.country] = (byCountry[c.country] || 0) + 1;
    }

    res.status(200).json({ ok: true, total: clicks.length, byCountry, recent: clicks.slice(0, 20) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
