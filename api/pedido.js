// Ficha privada de un pedido para despachar (la abre Andrés desde la notificación de ntfy).
// Los datos del cliente no viajan en la notificación: se leen acá, en vivo, desde Mercado Pago.
//
// GET /api/pedido?id=<id de pago MP>&k=<firma>
// La firma es un HMAC del id con MP_ACCESS_TOKEN: sin ella no se puede abrir ningún pedido.

import crypto from "crypto";
import { PRODUCTOS_UY } from "./pagar.js";

const SITE = "https://powervita.vercel.app";

export function firmaPedido(id) {
  const tok = process.env.MP_ACCESS_TOKEN || "";
  return crypto.createHmac("sha256", tok).update("pedido|" + id).digest("hex").slice(0, 32);
}

export const linkPedido = (id) => `${SITE}/api/pedido?id=${id}&k=${firmaPedido(id)}`;

function firmaValida(id, k) {
  const a = Buffer.from(firmaPedido(id));
  const b = Buffer.from(String(k || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function telUY(t) {
  let d = String(t || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("0")) d = d.slice(1);
  if (!d.startsWith("598")) d = "598" + d;
  return d;
}

const pagina = (titulo, cuerpo) => `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${esc(titulo)}</title><style>
body{margin:0;font-family:system-ui,-apple-system,Roboto,sans-serif;background:#f3f5f4;color:#16231d}
.w{max-width:520px;margin:0 auto;padding:16px}
.c{background:#fff;border-radius:16px;padding:18px 18px 8px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
h1{font-size:20px;margin:4px 0 12px}.lb{font-size:12px;font-weight:700;color:#6b7c74;text-transform:uppercase;letter-spacing:.5px}
.v{font-size:18px;font-weight:600;margin:2px 0 14px;word-break:break-word}
.b{display:block;text-align:center;padding:14px;border-radius:12px;font-weight:700;text-decoration:none;margin:8px 0}
.wa{background:#25d366;color:#fff}.cp{background:#0e3b2e;color:#fff;border:0;width:100%;font-size:16px}
.ok{color:#127a3a}.no{color:#b3261e}
</style></head><body><div class="w">${cuerpo}</div></body></html>`;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  const { id, k } = req.query || {};
  if (!/^\d+$/.test(String(id || "")) || !process.env.MP_ACCESS_TOKEN || !firmaValida(id, k)) {
    return res.status(404).send(pagina("No encontrado", `<div class="c"><h1>Pedido no encontrado</h1></div>`));
  }

  const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  });
  const pago = await r.json().catch(() => ({}));
  const ref = pago.external_reference || "";
  if (!r.ok || !ref.startsWith("pv|")) {
    return res.status(404).send(pagina("No encontrado", `<div class="c"><h1>Pedido no encontrado</h1></div>`));
  }

  const m = pago.metadata || {};
  const tel = telUY(m.telefono || ref.split("|")[2]);
  const items = (ref.split("|")[1] || "").split(",").filter(Boolean).map(x => {
    const [prod, q] = x.split("x");
    return `${q} × ${PRODUCTOS_UY[prod] || prod}`;
  });
  const nombre = m.nombre || [pago.payer?.first_name, pago.payer?.last_name].filter(Boolean).join(" ") || "Sin nombre";
  const direccion = m.direccion ? `${m.direccion}${m.departamento ? `, ${m.departamento}` : ""}` : "";
  const email = pago.payer?.email || "";
  const fecha = pago.date_approved ? new Date(pago.date_approved).toLocaleString("es-UY", { timeZone: "America/Montevideo" }) : "";
  const aprobado = pago.status === "approved";
  const etiqueta = [nombre, direccion, tel ? `Tel. 0${tel.slice(3)}` : ""].filter(Boolean).join("\n");

  const fila = (lb, v) => v ? `<div class="lb">${lb}</div><div class="v">${v}</div>` : "";

  res.status(200).send(pagina(`Pedido ${id}`, `
<div class="c">
  <h1>📦 Pedido Power Vita</h1>
  ${fila("Estado", aprobado ? `<span class="ok">✅ Pago aprobado</span>` : `<span class="no">⚠️ ${esc(pago.status)}</span>`)}
  ${fila("Productos", items.map(esc).join("<br>"))}
  ${fila("Total", `$${esc(Number(pago.transaction_amount || 0).toLocaleString("es-UY"))} UYU`)}
  ${fila("Fecha", esc(fecha))}
</div>
<div class="c">
  ${fila("Nombre", esc(nombre))}
  ${fila("Teléfono", tel ? `0${esc(tel.slice(3))}` : "Sin teléfono")}
  ${fila("Dirección", direccion ? esc(direccion) : `<span class="no">Sin dirección — pedírsela por WhatsApp</span>`)}
  ${fila("Email", esc(email))}
  ${fila("Pago MP", `#${esc(id)}`)}
</div>
${tel ? `<a class="b wa" href="https://wa.me/${tel}">💬 Escribirle por WhatsApp</a>` : ""}
<button class="b cp" onclick="navigator.clipboard.writeText(${esc(JSON.stringify(etiqueta))}).then(()=>this.textContent='✅ Copiado')">📋 Copiar datos para la etiqueta</button>
<p style="text-align:center;color:#6b7c74;font-size:13px">Entregar dentro de 72 hs hábiles del pago</p>`));
}
