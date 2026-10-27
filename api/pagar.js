// Crea un pago de Mercado Pago (Checkout Pro) con la cuenta de Andrés.
// Solo Uruguay: todos los productos a $2.150 UYU; desde la 2ª unidad (de cualquier producto) $250 menos c/u.
//
// GET  /api/pagar?prod=vita&p=598XXXXXXXX&q=1   → link que manda el bot (redirige a MP)
// POST /api/pagar { items:[{prod,q}], buyer:{nombre,telefono,direccion,departamento,email} }
//      → devuelve { url } (landing)
//
// Variables en Vercel: MP_ACCESS_TOKEN (obligatoria), PRECIO_UY (opcional, default 2150)

const PRECIO = Number(process.env.PRECIO_UY || 2150);
const DESCUENTO_EXTRA = Number(process.env.DESCUENTO_UY || 250); // por cada unidad desde la 2ª
const SITE = "https://powervita.vercel.app";

// Total de un pedido de n unidades: la 1ª a precio lleno, el resto con descuento.
export const totalUY = (n) => (n > 0 ? n * PRECIO - (n - 1) * DESCUENTO_EXTRA : 0);

export const PRODUCTOS_UY = {
  vita:   "Vita Xtra T+",
  thermo: "Thermo T3",
  nocarb: "Nocarb-T",
  prunex: "Prunex 1",
  biopro: "Biopro+ Fit",
};

const clean = (s, max = 120) => String(s || "").replace(/[|\n\r]/g, " ").trim().slice(0, max);

async function crearPreferencia({ items, buyer = {}, origen }) {
  const lineas = items
    .filter(i => PRODUCTOS_UY[i.prod])
    .map(i => ({ prod: i.prod, q: Math.min(Math.max(parseInt(i.q) || 1, 1), 10) }));
  if (!lineas.length) throw new Error("Producto inválido");

  const telefono = clean(buyer.telefono, 20).replace(/\D/g, "");
  const total = totalUY(lineas.reduce((s, l) => s + l.q, 0));
  // pv| identifica las ventas de Power Vita dentro de la cuenta MP (el reporte filtra por esto)
  const ref = `pv|${lineas.map(l => `${l.prod}x${l.q}`).join(",")}|${telefono}|${origen}|${Date.now()}`;

  // MP no acepta precios negativos: la 1ª unidad va a precio lleno y las demás ya con el descuento.
  const mpItems = [];
  lineas.forEach((l, i) => {
    const llenas = i === 0 ? 1 : 0;
    const base = { id: l.prod, title: `${PRODUCTOS_UY[l.prod]} — FuXion`, currency_id: "UYU" };
    if (llenas) mpItems.push({ ...base, quantity: 1, unit_price: PRECIO });
    if (l.q - llenas > 0) {
      mpItems.push({ ...base, title: `${base.title} (2ª unidad en adelante)`, quantity: l.q - llenas, unit_price: PRECIO - DESCUENTO_EXTRA });
    }
  });

  const body = {
    items: mpItems,
    payer: buyer.email ? { email: clean(buyer.email, 100) } : undefined,
    external_reference: ref,
    metadata: {
      nombre: clean(buyer.nombre),
      telefono,
      direccion: clean(buyer.direccion, 200),
      departamento: clean(buyer.departamento, 40),
      origen,
    },
    back_urls: {
      success: `${SITE}/gracias.html?v=${total}`,
      pending: `${SITE}/gracias.html?v=${total}`,
      failure: origen.startsWith("uy-")
        ? `${SITE}/uy/?p=${lineas[0].prod}&pago=error#pagar`
        : `${SITE}/?pago=error#comprar`,
    },
    auto_return: "approved",
    notification_url: `${SITE}/api/mp-webhook`,
    statement_descriptor: "POWERVITA",
  };

  const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok || !data.init_point) throw new Error(data.message || `MP respondió ${r.status}`);
  return { url: data.init_point, total };
}

export default async function handler(req, res) {
  if (!process.env.MP_ACCESS_TOKEN) {
    return res.status(500).json({ error: "MP_ACCESS_TOKEN no configurado en Vercel" });
  }

  try {
    if (req.method === "GET") {
      const { prod = "", p = "", q = "1" } = req.query;
      if (!PRODUCTOS_UY[prod]) return res.redirect(302, `${SITE}/#comprar`);
      const { url } = await crearPreferencia({
        items: [{ prod, q }],
        buyer: { telefono: p },
        origen: "bot",
      });
      return res.redirect(302, url);
    }

    if (req.method === "POST") {
      const { items = [], buyer = {}, origen = "" } = req.body || {};
      // origen: "uy-vita-<utm>" desde la página corta de campaña; nunca "bot" (lo usa el reporte)
      const o = String(origen).toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
      const { url, total } = await crearPreferencia({ items, buyer, origen: o && o !== "bot" ? o : "landing" });
      return res.status(200).json({ url, total });
    }

    return res.status(405).end();
  } catch (e) {
    console.error("pagar error:", e.message);
    if (req.method === "GET") return res.redirect(302, `${SITE}/?pago=error#comprar`);
    return res.status(400).json({ error: e.message });
  }
}
