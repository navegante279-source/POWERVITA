// Crea un pago de Mercado Pago (Checkout Pro) con la cuenta de Andrés.
// Solo Uruguay: todos los productos a $2.150 UYU; desde la 2ª unidad (de cualquier producto) $250 menos c/u;
// cada 5 unidades, 1 de regalo (se cobran 4). Hasta 10 cuotas con tarjeta.
//
// GET  /api/pagar?prod=vita&p=598XXXXXXXX&q=1   → link que manda el bot (redirige a MP)
// POST /api/pagar { items:[{prod,q}], buyer:{nombre,telefono,direccion,departamento,email} }
//      → devuelve { url } (landing)
//
// Variables en Vercel: MP_ACCESS_TOKEN (obligatoria), PRECIO_UY (opcional, default 2150)

const PRECIO = Number(process.env.PRECIO_UY || 2150);
const DESCUENTO_EXTRA = Number(process.env.DESCUENTO_UY || 250); // por cada unidad desde la 2ª
const SITE = "https://powervita.vercel.app";

const CUOTAS = 10;

// Unidades que se cobran: cada 5, una va de regalo.
export const pagasUY = (n) => n - Math.floor(n / 5);
// Total de un pedido de n unidades: la 1ª cobrada a precio lleno, el resto con descuento.
export const totalUY = (n) => {
  const p = pagasUY(n);
  return p > 0 ? p * PRECIO - (p - 1) * DESCUENTO_EXTRA : 0;
};

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
  const unidades = lineas.reduce((s, l) => s + l.q, 0);
  const esPrueba = origen.endsWith("-429272ac55526528"); // TEMPORAL: compra de prueba a $50, se quita después
  const total = esPrueba ? 50 : totalUY(unidades);
  // pv| identifica las ventas de Power Vita dentro de la cuenta MP (el reporte filtra por esto).
  // Lleva las cantidades completas (regalos incluidos): el webhook arma el envío con esto.
  const ref = `pv|${lineas.map(l => `${l.prod}x${l.q}`).join(",")}|${telefono}|${origen}|${Date.now()}`;

  // MP no acepta precios negativos ni en cero: la 1ª unidad va a precio lleno, las demás con el
  // descuento, y los regalos (las últimas unidades del pedido) no se cobran pero se nombran.
  let regalo = unidades - pagasUY(unidades);
  const porLinea = lineas.map(l => ({ ...l, pagas: l.q })).reverse();
  for (const l of porLinea) { const r = Math.min(regalo, l.pagas); l.pagas -= r; l.regalo = r; regalo -= r; }
  porLinea.reverse();
  const mpItems = [];
  let primera = true;
  for (const l of porLinea) {
    const nombre = `${PRODUCTOS_UY[l.prod]} — FuXion`;
    const base = { id: l.prod, currency_id: "UYU" };
    let resto = l.pagas;
    if (primera && resto > 0) { mpItems.push({ ...base, title: nombre, quantity: 1, unit_price: PRECIO }); resto--; primera = false; }
    if (resto > 0) mpItems.push({ ...base, title: `${nombre} (desde la 2ª unidad)`, quantity: resto, unit_price: PRECIO - DESCUENTO_EXTRA });
  }
  if (esPrueba) { mpItems.splice(1); mpItems[0].quantity = 1; mpItems[0].unit_price = 50; }
  const regalos = porLinea.filter(l => l.regalo).map(l => `${l.regalo} ${PRODUCTOS_UY[l.prod]}`);
  if (regalos.length) mpItems[mpItems.length - 1].title += ` · + ${regalos.join(", ")} de regalo`;

  const body = {
    items: mpItems,
    payment_methods: { installments: CUOTAS },
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
