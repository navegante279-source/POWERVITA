// GET /api/bot-status
// Returns Railway bot URL + live /health response.
// The Railway bot registers its URL in Supabase on every startup,
// so this endpoint works even when WhatsApp is broken.
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { SUPABASE_URL, SUPABASE_KEY } = process.env;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.json({
      ok: false,
      error: "Supabase no configurado en Vercel — agrega SUPABASE_URL y SUPABASE_KEY en Vercel env vars",
    });
  }

  // Read registered bot URL from the conversations table
  let botUrl = null;
  let registeredAt = null;
  try {
    const sbRes = await fetch(
      `${SUPABASE_URL}/rest/v1/conversations?phone=eq.__bot_url__&select=history,updated_at`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const rows = await sbRes.json();
    const entry = Array.isArray(rows) ? rows[0] : null;
    if (entry?.history?.[0]?.url) {
      botUrl = entry.history[0].url;
      registeredAt = entry.history[0].ts || entry.updated_at;
    }
  } catch (e) {
    return res.json({ ok: false, error: "Error al leer Supabase: " + e.message });
  }

  if (!botUrl) {
    return res.json({
      ok: false,
      botUrl: null,
      error: "Bot nunca registró su URL. Puede que nunca haya arrancado, o que Supabase no esté conectado al bot.",
      tip: "Verificá que el servicio de Railway esté corriendo. Si arranca con SUPABASE conectado, registra su URL automáticamente.",
    });
  }

  // Call the bot's /health endpoint
  let health = null;
  let reachable = false;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const healthRes = await fetch(`${botUrl}/health`, { signal: ctrl.signal });
    clearTimeout(timer);
    health = await healthRes.json();
    reachable = true;
  } catch (e) {
    health = { error: e.name === "AbortError" ? "timeout (>6s) — bot puede estar caído" : e.message };
  }

  res.json({
    ok: reachable,
    botUrl,
    registeredAt,
    health,
    tip: reachable
      ? "Bot activo. Si WhatsApp no funciona, revisá WHATSAPP_TOKEN en Railway Variables."
      : `Bot en ${botUrl} no responde. Entrá a railway.app y verificá que el servicio esté verde.`,
  });
}
