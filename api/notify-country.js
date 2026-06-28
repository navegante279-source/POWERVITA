export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { country, message } = req.body || {};
  if (!country) return res.status(400).json({ error: "country required" });

  const topic = process.env.NTFY_TOPIC;
  if (!topic) return res.status(200).json({ ok: true, skipped: "NTFY_TOPIC not set" });

  try {
    await fetch(`https://ntfy.sh/${topic}`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "Title": `Power Vita: consulta desde ${country}`,
        "Priority": "high",
        "Tags": "world_map,speech_balloon"
      },
      body: message
        ? `Mensaje: "${message}"\n\npowervita.vercel.app`
        : `Alguien de ${country} abrió el chat.\n\npowervita.vercel.app`
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
