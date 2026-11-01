// Servidor de la app /app de Power Vita y del seguimiento de la web.
//
// POST /api/panel?a=seg                    público: registra un paso de la visita (public/seg.js)
// POST /api/panel?a=datos  {rango}         con contraseña: ventas, pedidos, web y clientes
// POST /api/panel?a=chat   {phone}         con contraseña: conversación de un cliente
// POST /api/panel?a=despachar {id, hecho}  con contraseña: marca un pedido como despachado
//
// Contraseña: header X-Codigo = ADMIN_PASSWORD (la misma del panel viejo).
// Variables en Vercel: ADMIN_PASSWORD, MP_ACCESS_TOKEN, SUPABASE_URL, SUPABASE_KEY.
// Opcionales: META_ADS_TOKEN, COSTO_PRODUCTO, COSTO_ENVIO.

import crypto from "crypto";
import { PRODUCTOS_UY } from "./pagar.js";
import { linkPedido } from "./pedido.js";

const MONTO_MINIMO_REAL = 500; // los pagos menores son compras de prueba y no cuentan en los totales
const ABANDONO_MIN = 20;       // minutos desde que tocó Pagar para considerarlo abandono
const EN_VIVO_MIN = 3;
const PASOS = ["ping", "visita", "carrito", "datos", "whatsapp", "pago", "compra"];
const META_ACT = process.env.META_AD_ACCOUNT || "act_1835391137099406";

const corto = (s, n) => (s == null ? null : String(s).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n) || null);
const soloDigitos = (s) => String(s || "").replace(/\D/g, "");

function telUY(t) {
  let d = soloDigitos(t);
  if (!d) return "";
  if (d.startsWith("0")) d = d.slice(1);
  if (!d.startsWith("598")) d = "598" + d;
  return d;
}

async function db(path, init = {}) {
  const { SUPABASE_URL, SUPABASE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  return r;
}
async function dbJson(path) {
  try {
    const r = await db(path);
    if (!r || !r.ok) return null;
    return await r.json();
  } catch { return null; }
}

// Lee de a 1000 filas: Supabase corta cada respuesta en ese máximo.
async function dbTodo(path, tope = 20000) {
  const filas = [];
  for (let desde = 0; desde < tope; desde += 1000) {
    const parte = await dbJson(`${path}&limit=1000&offset=${desde}`);
    if (!parte) return desde ? filas : null;
    filas.push(...parte);
    if (parte.length < 1000) break;
  }
  return filas;
}

function codigoValido(c) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real || !c) return false;
  const a = crypto.createHash("sha256").update(String(real)).digest();
  const b = crypto.createHash("sha256").update(String(c)).digest();
  return crypto.timingSafeEqual(a, b);
}

// ---- Seguimiento público ----
async function registrarPaso(body) {
  const paso = String(body.paso || "");
  const sid = corto(body.sid, 40);
  if (!PASOS.includes(paso) || !sid || !/^[a-z0-9-]+$/i.test(sid)) return false;
  const conDatos = paso === "pago"; // nombre y teléfono solo cuando la persona tocó Pagar
  const valor = Number(body.valor);
  const fila = {
    sid, paso,
    prod: corto(body.prod, 20),
    origen: corto(body.origen, 40),
    disp: body.disp === "celular" ? "celular" : "computadora",
    valor: Number.isFinite(valor) && valor >= 0 && valor < 1e7 ? valor : null,
    nombre: conDatos ? corto(body.nombre, 80) : null,
    telefono: conDatos ? (telUY(body.telefono).slice(0, 16) || null) : null,
  };
  const r = await db("seg_eventos", { method: "POST", body: JSON.stringify(fila) });
  return !!(r && r.ok);
}

// ---- Mercado Pago ----
async function pagosMP(desdeISO) {
  const tok = process.env.MP_ACCESS_TOKEN;
  if (!tok) return { error: "Falta MP_ACCESS_TOKEN" };
  const todos = [];
  try {
    for (let offset = 0; offset < 1000; offset += 100) {
      const qs = new URLSearchParams({ range: "date_created", begin_date: desdeISO, end_date: "NOW", sort: "date_created", criteria: "desc", limit: "100", offset: String(offset) });
      const r = await fetch(`https://api.mercadopago.com/v1/payments/search?${qs}`, { headers: { Authorization: `Bearer ${tok}` } });
      const d = await r.json();
      if (!r.ok) return { error: d.message || `Mercado Pago respondió ${r.status}` };
      todos.push(...(d.results || []));
      if ((d.results || []).length < 100) break;
    }
  } catch (e) { return { error: e.message }; }
  // La cuenta es compartida con otros negocios: solo los de Power Vita
  return { pagos: todos.filter(p => String(p.external_reference || "").startsWith("pv|")) };
}

function pedidoDesde(p, despachados) {
  const partes = String(p.external_reference).split("|");
  const m = p.metadata || {};
  const items = (partes[1] || "").split(",").filter(Boolean).map(x => {
    const m2 = x.match(/^(.+)x(\d+)$/); // prunexx2: la cantidad es lo último, "prunex" también tiene x
    const prod = m2 ? m2[1] : x;
    return { prod, nombre: PRODUCTOS_UY[prod] || prod, q: m2 ? parseInt(m2[2]) : 1 };
  });
  const monto = Number(p.transaction_amount || 0);
  return {
    id: p.id,
    fecha: p.date_approved || p.date_created,
    estado: p.status,
    monto,
    neto: Number(p.transaction_details?.net_received_amount ?? monto),
    prueba: monto < MONTO_MINIMO_REAL,
    items,
    unidades: items.reduce((s, i) => s + i.q, 0),
    nombre: m.nombre || [p.payer?.first_name, p.payer?.last_name].filter(Boolean).join(" ") || "Sin nombre",
    telefono: telUY(m.telefono || partes[2]),
    direccion: m.direccion ? `${m.direccion}${m.departamento ? `, ${m.departamento}` : ""}` : "",
    origen: partes[3] || "",
    despachado: despachados.has(String(p.id)),
    link: p.status === "approved" ? linkPedido(p.id) : "",
  };
}

// ---- Meta (opcional: si no hay token la app lo indica) ----
async function gastoMeta(rango) {
  const tok = process.env.META_ADS_TOKEN;
  if (!tok) return null;
  const hoyUY = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
  const desde = new Date(Date.now() - 3 * 3600e3 - (rango - 1) * 86400e3).toISOString().slice(0, 10);
  try {
    const qs = new URLSearchParams({ level: "account", fields: "spend", time_range: JSON.stringify({ since: desde, until: hoyUY }), access_token: tok });
    const r = await fetch(`https://graph.facebook.com/v21.0/${META_ACT}/insights?${qs}`);
    const d = await r.json();
    return r.ok ? Number(d.data?.[0]?.spend || 0) : null;
  } catch { return null; }
}

function inicioDiaUY(diasAtras) {
  const uy = new Date(Date.now() - 3 * 3600e3 - diasAtras * 86400e3).toISOString().slice(0, 10);
  return `${uy}T00:00:00.000-03:00`;
}

function contarPor(lista, clave) {
  const c = {};
  for (const x of lista) { const k = clave(x) || "Sin dato"; c[k] = (c[k] || 0) + 1; }
  return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([nombre, n]) => ({ nombre, n }));
}

export function armarWeb(eventos, pedidosAprobados, ahora = Date.now()) {
  const porVisita = new Map();
  for (const e of eventos) {
    if (!porVisita.has(e.sid)) porVisita.set(e.sid, []);
    porVisita.get(e.sid).push(e);
  }
  const compraronTel = new Set(pedidosAprobados.map(p => p.telefono).filter(Boolean));
  const visitas = [...porVisita.values()].map(ev => {
    ev.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const tiene = (p) => ev.some(e => e.paso === p);
    const pago = [...ev].reverse().find(e => e.paso === "pago");
    return {
      ev, tiene, pago,
      ultimo: new Date(ev[ev.length - 1].created_at).getTime(),
      origen: ev.find(e => e.origen)?.origen || "",
      disp: ev[0].disp,
      prod: [...ev].reverse().find(e => e.prod)?.prod || "",
    };
  });
  const reales = visitas.filter(v => v.ev.some(e => e.paso !== "ping"));
  const embudo = [
    ["Visitas", "visita"], ["Agregaron al carrito", "carrito"], ["Completaron datos", "datos"], ["Tocaron Pagar", "pago"], ["Compraron", "compra"],
  ].map(([nombre, paso]) => ({ nombre, n: reales.filter(v => v.tiene(paso)).length }));

  const enVivo = visitas.filter(v => ahora - v.ultimo < EN_VIVO_MIN * 60e3).map(v => {
    const ult = [...v.ev].reverse().find(e => e.paso !== "ping");
    return { paso: ult?.paso || "visita", prod: PRODUCTOS_UY[v.prod] || v.prod, origen: v.origen, disp: v.disp, hace: Math.round((ahora - v.ultimo) / 60e3) };
  });

  const abandonos = visitas
    .filter(v => v.pago && !v.tiene("compra") && ahora - new Date(v.pago.created_at).getTime() > ABANDONO_MIN * 60e3 && !compraronTel.has(v.pago.telefono))
    .map(v => ({ nombre: v.pago.nombre || "", telefono: v.pago.telefono || "", valor: Number(v.pago.valor || 0), prod: v.prod, fecha: v.pago.created_at, origen: v.origen }))
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return {
    embudo, enVivo, abandonos,
    whatsapp: reales.filter(v => v.tiene("whatsapp")).length,
    origenes: contarPor(reales, v => v.origen).slice(0, 8),
    dispositivos: contarPor(reales, v => v.disp),
    productos: contarPor(reales.filter(v => v.prod), v => PRODUCTOS_UY[v.prod] || v.prod).slice(0, 6),
  };
}

async function armarDatos(rangoPedido) {
  const rango = [1, 7, 30].includes(Number(rangoPedido)) ? Number(rangoPedido) : 7;
  const desdeISO = inicioDiaUY(rango - 1);
  // Los pedidos se leen siempre 30 días: los que falta despachar no dependen del filtro de fechas.
  const desdePedidos = inicioDiaUY(29);

  const [mp, desp, eventos, leads, convs, gasto] = await Promise.all([
    pagosMP(desdePedidos),
    dbJson(`pedidos_despacho?select=pago_id&limit=2000`),
    dbTodo(`seg_eventos?select=sid,paso,prod,origen,disp,valor,nombre,telefono,created_at&created_at=gte.${encodeURIComponent(desdeISO)}&order=created_at.asc`),
    dbJson(`leads?select=phone,name,status,last_objective,source,created_at,updated_at&order=updated_at.desc&limit=100`),
    dbJson(`conversations?select=phone,transferred,last_message_at&order=last_message_at.desc&limit=200`),
    gastoMeta(rango),
  ]);

  // Limpieza: pasos de más de 90 días y pings viejos. Si falla no afecta la lectura.
  const hace90 = new Date(Date.now() - 90 * 86400e3).toISOString();
  const hace2 = new Date(Date.now() - 2 * 86400e3).toISOString();
  db(`seg_eventos?created_at=lt.${hace90}`, { method: "DELETE" }).catch(() => {});
  db(`seg_eventos?paso=eq.ping&created_at=lt.${hace2}`, { method: "DELETE" }).catch(() => {});

  const despachados = new Set((desp || []).map(d => String(d.pago_id)));
  const todos = (mp.pagos || []).map(p => pedidoDesde(p, despachados));
  const desdeMs = new Date(desdeISO).getTime();
  const aprobados = todos.filter(p => p.estado === "approved");
  const delRango = aprobados.filter(p => !p.prueba && new Date(p.fecha).getTime() >= desdeMs);

  const costoProd = Number(process.env.COSTO_PRODUCTO || 1000);
  const costoEnvio = Number(process.env.COSTO_ENVIO || 250);
  const monto = delRango.reduce((s, p) => s + p.monto, 0);
  const neto = delRango.reduce((s, p) => s + p.neto, 0);
  const unidades = delRango.reduce((s, p) => s + p.unidades, 0);
  const costos = unidades * costoProd + delRango.length * costoEnvio;

  const convPor = Object.fromEntries((convs || []).map(c => [c.phone, c]));
  const clientes = (leads || []).map(l => ({
    phone: l.phone, nombre: l.name || "", estado: l.status || "", interes: l.last_objective || "", origen: l.source || "",
    transferido: !!convPor[l.phone]?.transferred,
    ultimo: convPor[l.phone]?.last_message_at || l.updated_at,
  }));

  return {
    rango,
    ahora: new Date().toISOString(),
    avisos: {
      mp: mp.error || null,
      seguimiento: eventos === null ? "Falta crear las tablas (bot/migration_panel.sql)" : null,
      clientes: leads === null ? "No se pudieron leer los clientes" : null,
      gasto: gasto === null ? "Sin token de Meta" : null,
    },
    ventas: {
      pedidos: delRango.length, unidades, monto, neto, costos,
      ticket: delRango.length ? Math.round(monto / delRango.length) : 0,
      gastoAnuncios: gasto,
      ganancia: neto - costos - (gasto || 0),
      porDespachar: aprobados.filter(p => !p.prueba && !p.despachado).length,
    },
    pedidos: todos,
    web: armarWeb(eventos || [], aprobados),
    clientes,
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  if (req.method !== "POST") return res.status(405).end();

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } } // sendBeacon manda texto
  body = body || {};
  const a = req.query?.a;

  if (a === "seg") {
    try { await registrarPaso(body); } catch {}
    return res.status(204).end();
  }

  if (!codigoValido(req.headers["x-codigo"])) {
    await new Promise(r => setTimeout(r, 500));
    return res.status(401).json({ error: "Contraseña incorrecta" });
  }

  try {
    if (a === "datos") return res.status(200).json(await armarDatos(body.rango));

    if (a === "chat") {
      const phone = soloDigitos(body.phone).slice(0, 16);
      if (!phone) return res.status(400).json({ error: "Falta el teléfono" });
      const f = await dbJson(`conversations?select=history&phone=eq.${phone}&limit=1`);
      const hist = Array.isArray(f?.[0]?.history) ? f[0].history : [];
      return res.status(200).json({ mensajes: hist.slice(-60).map(m => ({ rol: m.role === "user" ? "cliente" : "bot", texto: String(m.content || "") })) });
    }

    if (a === "despachar") {
      const id = soloDigitos(body.id);
      if (!id) return res.status(400).json({ error: "Falta el pedido" });
      const r = body.hecho
        ? await db("pedidos_despacho", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates" }, body: JSON.stringify({ pago_id: Number(id) }) })
        : await db(`pedidos_despacho?pago_id=eq.${id}`, { method: "DELETE" });
      if (!r || !r.ok) return res.status(500).json({ error: "No se pudo guardar. ¿Están creadas las tablas?" });
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "Acción desconocida" });
  } catch (e) {
    console.error("panel error:", e.message);
    return res.status(500).json({ error: "Error del servidor" });
  }
}
