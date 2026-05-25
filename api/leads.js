export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { password } = req.body || {};
  if (!process.env.ADMIN_PASSWORD) return res.status(500).json({ error: "ADMIN_PASSWORD no configurada" });
  if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: "Contraseña incorrecta" });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ error: "Supabase no configurado en Vercel" });

  try {
    const [leadsRes, convsRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/leads?select=phone,name,country,lang,status,last_objective,updated_at&order=updated_at.desc&limit=50`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      }),
      fetch(`${SUPABASE_URL}/rest/v1/conversations?select=phone,transferred,opted_out,last_message_at,updated_at&order=updated_at.desc&limit=50`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      })
    ]);

    const leads = await leadsRes.json();
    const convs = await convsRes.json();

    // Merge conv data into leads
    const convMap = {};
    if (Array.isArray(convs)) convs.forEach(c => { convMap[c.phone] = c; });

    const merged = Array.isArray(leads) ? leads.map(l => ({
      ...l,
      transferred: convMap[l.phone]?.transferred || false,
      opted_out: convMap[l.phone]?.opted_out || false,
      last_message_at: convMap[l.phone]?.last_message_at || l.updated_at
    })) : [];

    res.status(200).json({ ok: true, leads: merged });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
