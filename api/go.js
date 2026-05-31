const LINKS = {
  uy: "https://tiendafuxion.com/storelt/Andresvarela/3073072",
  ar: "https://tiendafuxion.com/storelt/Andresvarela/3085903",
  co: "https://tiendafuxion.com/storelt/Andresvarela/3086029",
};

export default async function handler(req, res) {
  const c = (req.query.c || "uy").toLowerCase();
  const phone = req.query.p || "";
  const link = LINKS[c] || LINKS.uy;

  // Log click to Supabase (non-blocking)
  const { SUPABASE_URL, SUPABASE_KEY } = process.env;
  if (SUPABASE_URL && SUPABASE_KEY) {
    fetch(`${SUPABASE_URL}/rest/v1/clicks`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ country: c, phone, created_at: new Date().toISOString() }),
    }).catch(() => {});
  }

  res.redirect(302, link);
}
