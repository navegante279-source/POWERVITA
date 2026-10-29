// ============================================================
// REPORTE DE CAMPAÑA — Power Vita
// Junta Meta Ads (gasto/resultados) + Mercado Pago (ventas reales) + bot (Supabase)
// y arma un mensaje de WhatsApp con números, alertas y qué hacer.
//
// Variables (Railway): META_ADS_TOKEN (token de usuario del sistema con ads_read),
//   META_AD_ACCOUNT (default act_1835391137099406), MP_ACCESS_TOKEN,
//   ALERTA_COSTO_CONV (UYU, default 50)
// ============================================================

const GRAPH = "https://graph.facebook.com/v21.0";
const TZ = "America/Montevideo";
const {
  META_ADS_TOKEN,
  META_AD_ACCOUNT = "act_1835391137099406",
  MP_ACCESS_TOKEN,
  ALERTA_COSTO_CONV = "50",
  COSTO_PRODUCTO = "1000", // UYU que le cuesta a Andrés cada producto (25/10/2026)
  COSTO_ENVIO = "250",     // UYU por pedido — el envío está incluido en el precio, lo paga Andrés
} = process.env;

const ACT = {
  conv:     ["onsite_conversion.messaging_conversation_started_7d"],
  lpv:      ["landing_page_view"],
  checkout: ["offsite_conversion.fb_pixel_initiate_checkout", "initiate_checkout"],
  purchase: ["offsite_conversion.fb_pixel_purchase", "purchase"],
};

const money = (n) => (n < 0 ? "-$" : "$") + Math.abs(Math.round(n || 0)).toLocaleString("es-UY");
const pick = (actions = [], types) => {
  for (const t of types) {
    const a = actions.find(x => x.action_type === t);
    if (a) return Number(a.value) || 0;
  }
  return 0;
};

// Medianoche de Montevideo (UTC-3, sin horario de verano) hace `diasAtras` días
function inicioDia(diasAtras = 0) {
  const d = new Date(Date.now() - diasAtras * 86400000);
  return `${d.toLocaleDateString("en-CA", { timeZone: TZ })}T00:00:00.000-03:00`;
}
const horaUY = () => Number(new Date().toLocaleString("en-US", { timeZone: TZ, hour: "numeric", hour12: false }));

async function graph(path, params = {}) {
  const qs = new URLSearchParams({ ...params, access_token: META_ADS_TOKEN });
  const r = await fetch(`${GRAPH}/${path}?${qs}`);
  const data = await r.json();
  if (data.error) throw new Error(data.error.message);
  return data.data || [];
}

async function datosMeta() {
  if (!META_ADS_TOKEN) return { error: "Falta META_ADS_TOKEN en Railway" };
  try {
    const fields = "campaign_id,campaign_name,spend,impressions,reach,frequency,cpm,ctr,actions";
    const activo = JSON.stringify(["ACTIVE"]);
    const [hoy, semana, campanas, adsets, mes] = await Promise.all([
      graph(`${META_AD_ACCOUNT}/insights`, { level: "campaign", date_preset: "today", fields, limit: 100 }),
      graph(`${META_AD_ACCOUNT}/insights`, { level: "campaign", date_preset: "last_7d", fields, limit: 100 }),
      graph(`${META_AD_ACCOUNT}/campaigns`, { fields: "name,daily_budget,effective_status", effective_status: activo, limit: 100 }),
      graph(`${META_AD_ACCOUNT}/adsets`, { fields: "name,campaign_id,daily_budget,end_time,bid_strategy,bid_amount,effective_status", effective_status: activo, limit: 200 }),
      graph(`${META_AD_ACCOUNT}/insights`, { level: "account", date_preset: "this_month", fields: "spend" }),
    ]);
    return { hoy, semana, campanas, adsets, gastoMes: Number(mes[0]?.spend || 0) };
  } catch (e) {
    return { error: e.message };
  }
}

async function ventasMP(desde) {
  if (!MP_ACCESS_TOKEN) return { error: "Falta MP_ACCESS_TOKEN en Railway" };
  try {
    // La cuenta MP es compartida con otros negocios: se pagina todo y se filtra por la marca pv|
    const todos = [];
    for (let offset = 0; offset < 1000; offset += 100) {
      const qs = new URLSearchParams({
        range: "date_approved", begin_date: desde, end_date: "NOW",
        status: "approved", sort: "date_approved", criteria: "desc", limit: "100", offset: String(offset),
      });
      const r = await fetch(`https://api.mercadopago.com/v1/payments/search?${qs}`, {
        headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || `MP ${r.status}`);
      todos.push(...(data.results || []));
      if ((data.results || []).length < 100) break;
    }
    const pv = todos.filter(p => String(p.external_reference || "").startsWith("pv|"));
    // pv|vitax1,thermox2|... → unidades vendidas
    const unidades = pv.reduce((s, p) => s + String(p.external_reference).split("|")[1].split(",")
      .reduce((u, x) => u + (parseInt(x.split("x")[1]) || 1), 0), 0);
    return {
      n: pv.length,
      unidades,
      monto: pv.reduce((s, p) => s + (p.transaction_amount || 0), 0),
      neto: pv.reduce((s, p) => s + (p.transaction_details?.net_received_amount ?? p.transaction_amount ?? 0), 0),
      bot: pv.filter(p => /^bot$|-wa$/.test(String(p.external_reference).split("|")[3])).length,
    };
  } catch (e) {
    return { error: e.message };
  }
}

async function datosBot(supabase) {
  if (!supabase) return null;
  const hoy = inicioDia(0);
  const contar = async (q) => { const { count, error } = await q; return error ? null : count; };
  const base = () => supabase.from("leads").select("phone", { count: "exact", head: true });
  const [nuevos, links, vendidos] = await Promise.all([
    contar(base().gte("created_at", hoy)),            // requiere migration_reporte.sql
    contar(base().eq("status", "link_sent").gte("updated_at", hoy)),
    contar(base().eq("status", "sold").gte("updated_at", hoy)),
  ]);
  return { nuevos, links, vendidos };
}

function totales(filas = []) {
  return filas.reduce((t, f) => ({
    gasto: t.gasto + Number(f.spend || 0),
    conv: t.conv + pick(f.actions, ACT.conv),
    lpv: t.lpv + pick(f.actions, ACT.lpv),
    checkout: t.checkout + pick(f.actions, ACT.checkout),
    compras: t.compras + pick(f.actions, ACT.purchase),
  }), { gasto: 0, conv: 0, lpv: 0, checkout: 0, compras: 0 });
}

function resultado(f) {
  const conv = pick(f.actions, ACT.conv);
  if (conv) return { n: conv, label: "conv WA" };
  const compras = pick(f.actions, ACT.purchase);
  if (compras) return { n: compras, label: "compras" };
  return { n: pick(f.actions, ACT.lpv), label: "visitas web" };
}

function alertas({ meta, mp7, gasto7 }) {
  const out = [];
  if (meta.error) {
    out.push(`❌ No pude leer Meta Ads: ${meta.error}${/expired|session|token/i.test(meta.error) ? " → el token venció, generá uno nuevo" : ""}`);
    return out;
  }
  if (!meta.campanas.length) out.push("⏸️ No hay campañas activas en la cuenta.");

  const hora = horaUY();
  const gastoHoy = Object.fromEntries(meta.hoy.map(f => [f.campaign_id, Number(f.spend || 0)]));
  for (const c of meta.campanas) {
    const sets = meta.adsets.filter(a => a.campaign_id === c.id);
    const presupuesto = (Number(c.daily_budget) || sets.reduce((s, a) => s + (Number(a.daily_budget) || 0), 0)) / 100;
    const gastado = gastoHoy[c.id] || 0;
    if (presupuesto && hora >= 15 && gastado < presupuesto * 0.15) {
      const conCap = sets.some(a => /CAP/i.test(a.bid_strategy || ""));
      out.push(`🧊 "${c.name}" casi no gasta hoy (${money(gastado)} de ${money(presupuesto)})${conCap ? " — tiene tope de puja, probablemente no gana subastas: subí el tope o sacalo" : " — revisá rechazos o público muy chico"}.`);
    }
  }

  for (const a of meta.adsets) {
    if (!a.end_time) continue;
    const dias = (new Date(a.end_time) - Date.now()) / 86400000;
    if (dias > 0 && dias <= 3) out.push(`⏰ El conjunto "${a.name}" se apaga solo en ${Math.ceil(dias)} día(s) (fecha de fin). Extendela si va bien.`);
  }

  const tope = Number(ALERTA_COSTO_CONV);
  for (const f of meta.semana) {
    const conv = pick(f.actions, ACT.conv);
    const gasto = Number(f.spend || 0);
    if (conv && gasto > 200 && gasto / conv > tope) out.push(`💸 "${f.campaign_name}" paga ${money(gasto / conv)} por conversación (7 días), arriba de tu tope de ${money(tope)}.`);
    if (Number(f.frequency) > 3.5) out.push(`🔁 "${f.campaign_name}" tiene frecuencia ${Number(f.frequency).toFixed(1)} — el público está saturado, cambiá creativos o ampliá.`);
  }

  if (!mp7.error && gasto7 > 1500 && mp7.n === 0) out.push(`🚨 ${money(gasto7)} gastados en 7 días y 0 ventas por Mercado Pago. Revisá el bot y la landing antes de seguir invirtiendo.`);
  if (!mp7.error && mp7.n && gasto7) {
    // Margen real por venta: lo que deja MP (neto) menos el costo de los productos
    const margen = (mp7.neto - Number(COSTO_PRODUCTO) * mp7.unidades - Number(COSTO_ENVIO) * mp7.n) / mp7.n;
    const cpa = gasto7 / mp7.n;
    if (cpa > margen) out.push(`🔴 Cada venta te cuesta ${money(cpa)} en anuncios y deja ${money(margen)} de margen (7 días): estás perdiendo plata por venta.`);
  }
  if (mp7.error) out.push(`❌ No pude leer Mercado Pago: ${mp7.error}`);
  return out;
}

async function recomendacion(anthropic, texto) {
  if (!anthropic) return "";
  try {
    const r = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 220,
      system: "Sos el media buyer de Andrés (Power Vita, suplementos FuXion en Uruguay, ventas por WhatsApp y Mercado Pago, cada producto $2.150). Leés su reporte diario y decís qué hacer mañana. Máximo 3 líneas, concretas, sin markdown ni asteriscos. Si los datos son pocos (menos de 3 días o menos de 1000 UYU gastados), decí que todavía no hay que tocar nada.",
      messages: [{ role: "user", content: texto }],
    });
    return r.content[0]?.text?.trim() || "";
  } catch { return ""; }
}

// soloAlertas: devuelve null si no hay nada que avisar (para el chequeo de mediodía)
export async function armarReporte({ supabase, anthropic, soloAlertas = false } = {}) {
  const inicioMes = `${new Date().toLocaleDateString("en-CA", { timeZone: TZ }).slice(0, 7)}-01T00:00:00.000-03:00`;
  const [meta, mpHoy, mp7, bot, mpMes] = await Promise.all([
    datosMeta(), ventasMP(inicioDia(0)), ventasMP(inicioDia(6)), datosBot(supabase), ventasMP(inicioMes),
  ]);

  const tHoy = meta.error ? null : totales(meta.hoy);
  const t7 = meta.error ? null : totales(meta.semana);
  const avisos = alertas({ meta, mp7, gasto7: t7?.gasto || 0 });

  if (soloAlertas) return avisos.length ? `⚠️ ALERTAS POWER VITA\n\n${avisos.join("\n\n")}` : null;

  const fecha = new Date().toLocaleString("es-UY", { timeZone: TZ, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  const L = [`📊 REPORTE POWER VITA — ${fecha}`, ""];

  const bloque = (titulo, t, mp) => {
    L.push(titulo);
    if (t) {
      L.push(`💸 Gasto: ${money(t.gasto)}`);
      L.push(`💬 Conversaciones WA: ${t.conv}${t.conv ? ` (${money(t.gasto / t.conv)} c/u)` : ""}`);
      if (t.lpv) L.push(`🌐 Visitas a la landing: ${t.lpv}`);
      if (t.checkout) L.push(`🛒 Fueron a pagar: ${t.checkout}`);
    }
    if (!mp.error) {
      L.push(`💰 Ventas MP: ${mp.n} · ${money(mp.monto)}${mp.n ? ` (${mp.bot} por el bot)` : ""}`);
      if (t?.gasto) L.push(`📈 Retorno: ${(mp.monto / t.gasto).toFixed(2)}x${mp.n ? ` · costo por venta ${money(t.gasto / mp.n)}` : ""}`);
    }
    L.push("");
  };
  bloque("HOY", tHoy, mpHoy);
  bloque("ÚLTIMOS 7 DÍAS", t7, mp7);

  if (!meta.error && meta.hoy.length) {
    L.push("POR CAMPAÑA (hoy)");
    for (const f of [...meta.hoy].sort((a, b) => b.spend - a.spend)) {
      const r = resultado(f);
      L.push(`• ${f.campaign_name}: ${money(f.spend)} · ${r.n} ${r.label}${r.n ? ` · ${money(f.spend / r.n)} c/u` : ""}`);
    }
    L.push("");
  }

  if (bot) {
    L.push("BOT (hoy)");
    if (bot.nuevos !== null) L.push(`🆕 Contactos nuevos: ${bot.nuevos}`);
    if (bot.links !== null) L.push(`🔗 Con link de pago pendiente: ${bot.links}`);
    if (bot.vendidos !== null) L.push(`✅ Vendidos: ${bot.vendidos}`);
    L.push("");
  }

  if (!mpMes.error && !meta.error) {
    const costo = Number(COSTO_PRODUCTO) * mpMes.unidades;
    const envios = Number(COSTO_ENVIO) * mpMes.n;
    const resultado = mpMes.neto - meta.gastoMes - (costo || 0) - envios;
    L.push("📒 BALANCE DEL MES (solo Power Vita)");
    L.push(`Ventas: ${mpMes.n} (${mpMes.unidades} productos) · ${money(mpMes.monto)}`);
    L.push(`Comisión Mercado Pago: -${money(mpMes.monto - mpMes.neto)}`);
    L.push(`Anuncios Meta: -${money(meta.gastoMes)}`);
    if (costo) L.push(`Costo de productos: -${money(costo)}`);
    if (envios) L.push(`Envíos: -${money(envios)}`);
    L.push(`${resultado >= 0 ? "🟢" : "🔴"} ${costo ? "Ganancia" : "Queda (sin descontar costo de producto)"}: ${money(resultado)}`, "");
  }

  if (avisos.length) L.push("⚠️ ALERTAS", ...avisos, "");

  const consejo = await recomendacion(anthropic, L.join("\n"));
  if (consejo) L.push("💡 QUÉ HARÍA", consejo);

  return L.join("\n").trim();
}
