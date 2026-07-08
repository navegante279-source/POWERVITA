const LINKS = {
  uy: "https://tiendafuxion.com/storelt/Andresvarela/3073072",
  ar: "https://tiendafuxion.com/storelt/Andresvarela/3085903",
  co: "https://tiendafuxion.com/storelt/Andresvarela/3086029",
};

const PRODUCT_LINKS = {
  uy: {
    prunex: "https://tiendafuxion.com/storelt/Andresvarela/3073072",
    vita:   "https://tiendafuxion.com/storelt/Andresvarela/3062050",
    biopro: "https://tiendafuxion.com/storelt/Andresvarela/3073816",
    nocarb: "https://tiendafuxion.com/storelt/Andresvarela/3073820",
    thermo: "https://tiendafuxion.com/storelt/Andresvarela/3073822",
  },
  ar: {
    prunex: "https://tiendafuxion.com/storelt/Andresvarela/3085903",
    vita:   "https://tiendafuxion.com/storelt/Andresvarela/3085893",
    biopro: "https://tiendafuxion.com/storelt/Andresvarela/3085938",
    nocarb: "https://tiendafuxion.com/storelt/Andresvarela/3085893",
    thermo: "https://tiendafuxion.com/storelt/Andresvarela/3085898",
  },
  co: {
    prunex: "https://tiendafuxion.com/storelt/Andresvarela/3086029",
    vita:   "https://tiendafuxion.com/storelt/Andresvarela/3086025",
    biopro: "https://tiendafuxion.com/storelt/Andresvarela/3086030",
    nocarb: "https://tiendafuxion.com/storelt/Andresvarela/3086028",
    thermo: "https://tiendafuxion.com/storelt/Andresvarela/3086074",
  },
};

const PRODUCT_NAMES = {
  prunex: "Prunex 1", vita: "Vita Xtra T+",
  biopro: "Biopro+ Fit", nocarb: "Nocarb-T", thermo: "Thermo T3",
};

const FLAGS = { uy: "🇺🇾 Uruguay", ar: "🇦🇷 Argentina", co: "🇨🇴 Colombia" };

async function sendWA(to, text) {
  const { WHATSAPP_TOKEN, WHATSAPP_PHONE_ID } = process.env;
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) return;
  await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
  }).catch(() => {});
}

export default async function handler(req, res) {
  const c = (req.query.c || "uy").toLowerCase();
  const prod = (req.query.prod || "").toLowerCase();
  const phone = req.query.p || "";

  const countryLinks = PRODUCT_LINKS[c] || {};
  const link = (prod && countryLinks[prod]) || LINKS[c] || LINKS.uy;
  const productName = prod ? (PRODUCT_NAMES[prod] || prod) : "";

  const { SUPABASE_URL, SUPABASE_KEY, OWNER_PHONE } = process.env;

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

  if (OWNER_PHONE) {
    const hora = new Date().toLocaleString("es-UY", { timeZone: "America/Montevideo", hour: "2-digit", minute: "2-digit" });
    const msg =
      `🔗 CLICK EN LINK DE COMPRA\n\n` +
      `${FLAGS[c] || "🌍 Internacional"}${productName ? ` — ${productName}` : ""}\n` +
      (phone ? `📱 wa.me/${phone}\n` : "") +
      `🕐 ${hora}\n\n` +
      `👉 Puede estar comprando ahora mismo`;
    sendWA(OWNER_PHONE, msg);
  }

  res.redirect(302, link);
}
