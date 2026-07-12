// ============================================================
// POWERVITA FUXION BOT — Sistema Completo
// Stack: Node.js + Express + Anthropic Claude + Supabase
// WhatsApp: Meta Business API
// Países: Sudamérica, Centroamérica, Norteamérica, Europa
// Build: 2026-07-10
// ============================================================

import express from "express";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";
import ws from "ws";

// Node.js 18 doesn't have native WebSocket — polyfill before Supabase init
if (!globalThis.WebSocket) globalThis.WebSocket = ws.WebSocket ?? ws;

const app = express();
app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));

// ── ENVIRONMENT ───────────────────────────────────────────────
const {
  WHATSAPP_TOKEN,
  WHATSAPP_PHONE_ID,
  VERIFY_TOKEN,
  ANTHROPIC_API_KEY,
  SUPABASE_URL,
  SUPABASE_KEY,
  OWNER_PHONE = "59898950206",
  OWNER_NAME = "Andrés",
  LANDING_URL = "https://powervita.vercel.app/",
  FUXION_BUY_LINK = "https://tiendafuxion.com/storelt/Andresvarela/3085903",
  BUSINESS_HOURS_START = "9",
  BUSINESS_HOURS_END = "22",
  WEBHOOK_APP_SECRET,
  PORT = 3000,
} = process.env;

// ── CLIENTS ───────────────────────────────────────────────────
// Supabase is optional — bot runs in degraded mode (no DB) if missing
let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (e) {
    console.error("⚠️ Supabase init failed:", e.message, "— running without DB");
  }
} else {
  console.warn("⚠️ SUPABASE_URL or SUPABASE_KEY missing — running without DB (no conversation history, no leads)");
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// ── SISTEMA DE APRENDIZAJE ────────────────────────────────────
// Cada 6h analiza conversaciones reales, extrae patrones de dolor,
// productos que resonaron y cierres que funcionaron. Los inyecta en
// el system prompt para que el bot mejore con cada ciclo.

let learnedInsights = "";       // texto plano, actualizado cada 6h
let insightsUpdatedAt = null;   // Date del último refresh

async function refreshInsights() {
  if (!supabase) { console.log("🧠 refreshInsights skipped — no Supabase"); return; }
  try {
    const cutoff30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Leads que cerraron (sold/link_sent) y los que se enfriaron (cold)
    const { data: leads } = await supabase
      .from("leads")
      .select("phone, name, country, status")
      .gte("updated_at", cutoff30d)
      .in("status", ["sold", "link_sent", "cold"])
      .limit(60);

    if (!leads?.length) { console.log("🧠 No hay leads para aprender"); return; }

    const successful = leads.filter(l => ["sold", "link_sent"].includes(l.status)).slice(0, 20);
    const failed     = leads.filter(l => l.status === "cold").slice(0, 10);
    const toFetch    = [...successful, ...failed];

    const convs = await Promise.all(toFetch.map(l => getConversation(l.phone)));

    const formatConv = (conv, lead, outcome) => {
      if (!conv?.history?.length) return null;
      const msgs = conv.history
        .filter(h => h.role !== "system")
        .map(h => `${h.role === "user" ? "CLIENTE" : "BOT"}: ${h.content.slice(0, 300)}`)
        .join("\n");
      return `[${outcome} — ${lead.country}]\n${msgs}`;
    };

    const blocks = toFetch
      .map((lead, i) => formatConv(convs[i], lead, ["sold","link_sent"].includes(lead.status) ? "CERRADO" : "FRÍO"))
      .filter(Boolean)
      .join("\n\n---\n\n");

    if (!blocks) return;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 900,
      system: "Sos un estratega de ventas conversacionales experto en suplementos nutricionales para Latinoamérica. Analizás patrones en conversaciones reales de WhatsApp para mejorar la tasa de cierre.",
      messages: [{
        role: "user",
        content: `Analizá estas conversaciones reales de un bot de ventas (CERRADO = llegó al link de compra, FRÍO = se enfrió sin comprar).

Extraé en texto plano, sin markdown, máximo 750 palabras. Organizalo en estos 4 bloques con sus títulos exactos:

FRASES DEL CLIENTE QUE ABRIERON LA VENTA:
Las 5-6 frases textuales que usaron clientes que CERRARON para describir su dolor. Copiá textual, con comillas.

DOLOR → PRODUCTO QUE CONVIRTIÓ:
Para cada dolor en CERRADOS: qué producto se recomendó y en cuántos mensajes cerró. Ej: "constipación → Prunex 1, 3 mensajes".

FRASES DEL BOT QUE AVANZARON LA CONVERSACIÓN:
Las 3-4 frases del bot que recibieron respuesta de avance (no silencio). Copiá textual, con comillas.

QUÉ MATÓ LAS CONVERSACIONES:
Los 3 patrones que aparecen en los FRÍOS justo antes de que el cliente dejara de responder.

Solo datos concretos de las conversaciones. Sin teoría. Sin bullets.

CONVERSACIONES:
${blocks.slice(0, 9000)}`
      }]
    });

    learnedInsights = response.content[0].text;
    insightsUpdatedAt = new Date();
    console.log(`🧠 Insights actualizados — ${successful.length} cierres + ${failed.length} fríos analizados`);

    // Notificar al dueño con los insights del día
    sendWAMessage(OWNER_PHONE,
      `🧠 Aprendizaje diario actualizado (${successful.length} conversaciones exitosas + ${failed.length} frías):\n\n${learnedInsights.slice(0, 900)}`
    ).catch(() => {});

  } catch (err) {
    console.error("refreshInsights error:", err.message);
  }
}

// Primer refresh 60s después del inicio, luego cada 6h
setTimeout(refreshInsights, 60_000);
setInterval(refreshInsights, 6 * 60 * 60 * 1000);

// ── AGENT NAME ROTATION ───────────────────────────────────────
const AGENT_NAMES = ["Valeria", "Luna", "Sofía"];

function getAgentName(phone) {
  const sum = [...phone].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AGENT_NAMES[sum % AGENT_NAMES.length];
}

// ── STOP / OPT-OUT DETECTION ─────────────────────────────────
// Phrases that must match as whole words or exact phrases only
const STOP_PHRASES = [
  "no quiero mensajes", "no me escribas", "no me contactes",
  "darme de baja", "no más mensajes", "no mas mensajes",
  "não quero mensajes", "nao quero", "não me mande", "nao me mande",
  "leave me alone", "dont contact me", "don't contact me",
  "opt out", "optout", "no more messages", "unsubscribe",
];
// Single words that must match the entire message (or be very short messages)
const STOP_WORDS = [
  "stop", "parar", "detener", "cancelar suscripcion",
  "sair", "pare", "stopp", "abmelden", "fermare",
];

function isStopMessage(text) {
  const normalized = text.toLowerCase().trim();
  if (STOP_PHRASES.some((ph) => normalized.includes(ph))) return true;
  // Single-word stop: only if the entire message is that word (± punctuation)
  const bare = normalized.replace(/[^a-záéíóúñüàâçèêëîïôùûü]/g, " ").trim();
  return STOP_WORDS.some((w) => bare === w || bare === w + " ");
}

const STOP_REPLIES = {
  es: "Entendido 😊 No te enviaremos más mensajes. Si en algún momento querés retomar, escríbenos y con gusto te atendemos. ¡Que tengas un excelente día! 🌿",
  pt: "Entendido 😊 Não enviaremos mais mensagens. Se quiser retomar, é só nos escrever. Tenha um ótimo dia! 🌿",
  en: "Got it 😊 We won't send you any more messages. If you ever want to reconnect, just write to us. Have a great day! 🌿",
  fr: "Compris 😊 Nous ne vous enverrons plus de messages. Si vous souhaitez reprendre contact, écrivez-nous. Bonne journée! 🌿",
  it: "Capito 😊 Non ti invieremo altri messaggi. Se vuoi riprendere, scrivici pure. Buona giornata! 🌿",
  de: "Verstanden 😊 Wir werden Ihnen keine Nachrichten mehr senden. Falls Sie sich melden möchten, schreiben Sie uns. Einen schönen Tag! 🌿",
};

// ── RATE LIMITING (máx 5 mensajes por minuto por usuario) ────
const rateLimitMap = new Map(); // phone → [timestamps]

function isRateLimited(phone) {
  const now = Date.now();
  const window = 60_000; // 1 minuto
  const limit = 5;
  const timestamps = (rateLimitMap.get(phone) || []).filter(t => now - t < window);
  timestamps.push(now);
  rateLimitMap.set(phone, timestamps);
  return timestamps.length > limit;
}

// Limpiar el mapa cada 5 minutos para no acumular memoria
setInterval(() => rateLimitMap.clear(), 5 * 60_000);

// ── MESSAGE DEDUPLICATION ─────────────────────────────────────
const processedMessages = new Set(); // message IDs ya procesados

function isDuplicate(msgId) {
  if (processedMessages.has(msgId)) return true;
  processedMessages.add(msgId);
  // Limpiar IDs viejos después de 10 minutos
  setTimeout(() => processedMessages.delete(msgId), 10 * 60_000);
  return false;
}

// ── DISTRIBUTOR DETECTION ─────────────────────────────────────
const DISTRIBUTOR_KEYWORDS = [
  // Español
  "distribuidor", "distribuidora", "vender", "vendo", "negocio", "negocio propio",
  "ganar dinero", "trabajo", "ingresos", "socio", "socia", "red", "multinivel",
  "emprender", "empresa", "comisión", "comision", "unirme", "unirte", "equipo",
  "cómo funciona el negocio", "como funciona el negocio", "quiero vender",
  "ser distribuidor", "oportunidad de negocio",
  // Portugués
  "distribuidor", "vender", "negócio", "ganhar dinheiro", "renda", "parceiro",
  "empreender", "comissão", "quero vender",
  // Inglés
  "distributor", "sell", "business", "earn money", "income", "partner",
  "join", "opportunity", "network", "commission", "entrepreneur",
];

function isDistributorInquiry(text) {
  const normalized = text.toLowerCase();
  return DISTRIBUTOR_KEYWORDS.some(kw => normalized.includes(kw));
}

// ── WEBHOOK SIGNATURE VERIFICATION ───────────────────────────
function verifyMetaSignature(req) {
  if (!WEBHOOK_APP_SECRET) return true; // Skip if secret not configured
  const signature = req.headers["x-hub-signature-256"];
  if (!signature) return false;
  if (!req.rawBody) return false;
  const expected = "sha256=" + crypto
    .createHmac("sha256", WEBHOOK_APP_SECRET)
    .update(req.rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ── PRODUCTS UNAVAILABLE BY COUNTRY ──────────────────────────
// Uruguay: solo Prunex 1, Thermo T3, Nocarb-T, Biopro+ Fit, Vita Xtra T+
// Argentina y Colombia: según campañas activas de Meta Ads
const COUNTRY_UNAVAILABLE = {
  "Uruguay":        ["Flora Liv", "Liquid Fibra", "Alpha Balance", "Rexet", "Berry Balance",
                     "Biopro+ Sport", "Biopro+ Tect", "Protein Active", "Nutraday", "Xpeed",
                     "Café & Café Fit", "Chocolate Fit", "Vera+", "Gano Excel", "Café Gano",
                     "Youth Elixir", "Beauty In", "Golden FLX", "Passion", "On", "No Stress",
                     "Pre Sport", "Post Sport", "HGH", "Probal", "Xtra Mile"],
  "Argentina":      ["Protein Active", "Xpeed", "Café & Café Fit",
                     "Gano Excel", "Café Gano", "Golden FLX", "No Stress", "Probal"],
  "Colombia":       ["Xpeed", "Youth Elixir"],
  "México":         [],
  "España":         ["Pre Sport"],
  "Brasil":         [],
  "Chile":          [],
  "Perú":           [],
  "Estados Unidos": [],
};

const ALL_PRODUCTS = [
  "Prunex 1", "Flora Liv", "Liquid Fibra", "Alpha Balance", "Rexet", "Berry Balance",
  "Biopro+ Fit", "Biopro+ Sport", "Biopro+ Tect", "Protein Active",
  "Vita Xtra T+", "Nutraday", "Xpeed",
  "Thermo T3", "Nocarb-T", "Café & Café Fit", "Chocolate Fit",
  "Vera+", "Gano Excel", "Café Gano",
  "Youth Elixir", "Beauty In", "Golden FLX", "Passion", "HGH",
  "On", "No Stress",
  "Pre Sport", "Post Sport", "Probal", "Xtra Mile",
];

function getUnavailableProducts(country) {
  return COUNTRY_UNAVAILABLE[country] || [];
}

function getAvailableProducts(country) {
  const unavailable = getUnavailableProducts(country);
  return ALL_PRODUCTS.filter(p => !unavailable.includes(p));
}

// ── COUNTRY DETECTION BY PHONE PREFIX ────────────────────────
// Ordered longest prefix first for most specific match
const COUNTRY_PREFIXES = [
  // Sudamérica
  { prefix: "5491",  country: "Argentina",     lang: "es", currency: "ARS" },
  { prefix: "54",    country: "Argentina",     lang: "es", currency: "ARS" },
  { prefix: "591",   country: "Bolivia",       lang: "es", currency: "BOB" },
  { prefix: "55",    country: "Brasil",        lang: "pt", currency: "BRL" },
  { prefix: "56",    country: "Chile",         lang: "es", currency: "CLP" },
  { prefix: "57",    country: "Colombia",      lang: "es", currency: "COP" },
  { prefix: "593",   country: "Ecuador",       lang: "es", currency: "USD" },
  { prefix: "595",   country: "Paraguay",      lang: "es", currency: "PYG" },
  { prefix: "51",    country: "Perú",          lang: "es", currency: "PEN" },
  { prefix: "598",   country: "Uruguay",       lang: "es", currency: "UYU" },
  { prefix: "58",    country: "Venezuela",     lang: "es", currency: "USD" },
  // Centroamérica & Caribe
  { prefix: "506",   country: "Costa Rica",    lang: "es", currency: "CRC" },
  { prefix: "502",   country: "Guatemala",     lang: "es", currency: "GTQ" },
  { prefix: "504",   country: "Honduras",      lang: "es", currency: "HNL" },
  { prefix: "507",   country: "Panamá",        lang: "es", currency: "PAB" },
  { prefix: "1787",  country: "Puerto Rico",   lang: "es", currency: "USD" },
  { prefix: "1939",  country: "Puerto Rico",   lang: "es", currency: "USD" },
  // Norteamérica
  { prefix: "52",    country: "México",        lang: "es", currency: "MXN" },
  { prefix: "1",     country: "Estados Unidos",lang: "en", currency: "USD" },
  // Europa
  { prefix: "49",    country: "Alemania",      lang: "de", currency: "EUR" },
  { prefix: "43",    country: "Austria",       lang: "de", currency: "EUR" },
  { prefix: "32",    country: "Bélgica",       lang: "fr", currency: "EUR" },
  { prefix: "357",   country: "Chipre",        lang: "en", currency: "EUR" },
  { prefix: "385",   country: "Croacia",       lang: "en", currency: "EUR" },
  { prefix: "421",   country: "Eslovaquia",    lang: "en", currency: "EUR" },
  { prefix: "386",   country: "Eslovenia",     lang: "en", currency: "EUR" },
  { prefix: "34",    country: "España",        lang: "es", currency: "EUR" },
  { prefix: "372",   country: "Estonia",       lang: "en", currency: "EUR" },
  { prefix: "358",   country: "Finlandia",     lang: "en", currency: "EUR" },
  { prefix: "33",    country: "Francia",       lang: "fr", currency: "EUR" },
  { prefix: "30",    country: "Grecia",        lang: "en", currency: "EUR" },
  { prefix: "353",   country: "Irlanda",       lang: "en", currency: "EUR" },
  { prefix: "39",    country: "Italia",        lang: "it", currency: "EUR" },
  { prefix: "371",   country: "Letonia",       lang: "en", currency: "EUR" },
  { prefix: "370",   country: "Lituania",      lang: "en", currency: "EUR" },
  { prefix: "352",   country: "Luxemburgo",    lang: "fr", currency: "EUR" },
  { prefix: "356",   country: "Malta",         lang: "en", currency: "EUR" },
  { prefix: "31",    country: "Países Bajos",  lang: "nl", currency: "EUR" },
  { prefix: "351",   country: "Portugal",      lang: "pt", currency: "EUR" },
];

function detectCountry(phone) {
  const normalized = phone.replace(/\D/g, "");
  const sorted = [...COUNTRY_PREFIXES].sort((a, b) => b.prefix.length - a.prefix.length);
  for (const entry of sorted) {
    if (normalized.startsWith(entry.prefix)) return entry;
  }
  return { country: "Internacional", lang: "es", currency: "USD" };
}

// ── BUSINESS HOURS (Uruguay UTC-3) ───────────────────────────
function isBusinessHours() {
  const now = new Date();
  const uyHour = (now.getUTCHours() - 3 + 24) % 24;
  return uyHour >= parseInt(BUSINESS_HOURS_START) && uyHour < parseInt(BUSINESS_HOURS_END);
}

// ── WARM LEAD DETECTION (mensajes pre-armados desde la landing o anuncio) ──
const WARM_LEAD_PATTERNS = [
  "vi la oferta en la web", "vi la oferta", "quiero hacer mi primer pedido",
  "quiero el ", "quiero comprar", "me interesa el ", "quiero pedir",
  "cómo lo pido", "como lo pido", "quiero pedirlo", "quiero ordenar",
  "vi el anuncio", "desde la página", "desde la web",
  // Leads de Meta Ads
  "asesoría personalizada", "asesoria personalizada",
  "quiero asesoría", "quiero asesoria",
  "quiero información", "quiero informacion",
  "prunex", "thermo t3", "biopro", "vita xtra",
];

function isWarmLead(text) {
  const normalized = text.toLowerCase();
  return WARM_LEAD_PATTERNS.some(p => normalized.includes(p));
}

// ── OBJECTION DETECTION ───────────────────────────────────────
const OBJECTION_PATTERNS = {
  price:       ["caro", "cara", "costoso", "costosa", "no tengo plata", "no tengo dinero", "muy caro", "no puedo pagar", "expensive", "too much", "custa muito", "no me alcanza", "no tengo presupuesto"],
  delay:       ["lo pienso", "lo voy a pensar", "déjame pensar", "dejame pensar", "después", "despues", "luego", "más adelante", "más tarde", "think about", "let me think", "no es el momento", "ahora no puedo"],
  doubt:       ["no sé si funciona", "no se si funciona", "no funciona", "ya probé", "ya probe", "no me funcionó", "no me funciono", "doesn't work", "não funciona", "no veo resultados", "no sirve", "no creo que funcione", "no le creo", "es mentira", "no da resultado", "no tiene efecto", "lo tomé y nada", "lo tome y nada"],
  trust:       ["no conozco", "qué es fuxion", "que es fuxion", "es seguro", "es confiable", "what is fuxion", "legit", "es real", "es una estafa", "es piramide", "es pirámide"],
  partner:     ["consultar con", "preguntarle a", "hablar con mi", "decirle a mi", "mi marido", "mi esposa", "mi pareja", "mi esposo", "mi mamá", "mi familia", "hablar con alguien"],
  competition: ["vi algo más barato", "tengo algo parecido", "ya tengo algo", "ya uso algo", "similar más barato", "más económico", "en farmacia", "en mercado libre", "en amazon", "ya compré"],
  skepticism:  ["vi comentarios malos", "alguien me dijo", "me dijeron que", "leí que", "lei que", "comentarios negativos", "no funciona para todos", "es multinivel", "multi nivel"],
};

function detectObjection(text) {
  const normalized = text.toLowerCase();
  for (const [type, patterns] of Object.entries(OBJECTION_PATTERNS)) {
    if (patterns.some(p => normalized.includes(p))) return type;
  }
  return null;
}

// ── BUYING SIGNAL DETECTION ───────────────────────────────────
// Estos son "sí" implícitos — el cliente ya decidió, solo necesita el paso final
const BUYING_SIGNAL_PATTERNS = [
  // Logística / envío
  "cómo me llega", "como me llega", "cuánto tarda", "cuanto tarda",
  "cómo se envía", "como se envia", "cuándo llega", "cuando llega",
  "hacen envío", "hacen envio", "llegan a", "mandan a", "entregan en",
  // Pago
  "cómo se paga", "como se paga", "cómo pago", "como pago",
  "métodos de pago", "metodos de pago", "formas de pago",
  "acepta tarjeta", "aceptan tarjeta", "se puede pagar con",
  "transferencia", "mercado pago", "paypal",
  // Intención directa
  "quiero pedirlo", "quiero comprarlo", "quiero empezar", "quiero arrancar",
  "cómo arranco", "como arranco", "cómo empiezo", "como empiezo",
  "quiero el pack", "lo quiero", "lo compro", "me lo llevo",
  // Cantidad / duración
  "para cuánto tiempo", "cuántas cajas", "cuántos frascos",
  "cuánto dura", "cuanto dura", "alcanza para cuánto",
];

function hasBuyingSignal(text) {
  const normalized = text.toLowerCase();
  return BUYING_SIGNAL_PATTERNS.some(p => normalized.includes(p));
}

// ── THIRD PARTY PURCHASE DETECTION ───────────────────────────
// Compra para otra persona — hay que calificar el problema del tercero, no del comprador
const THIRD_PARTY_PATTERNS = [
  "es para mi mamá", "es para mi papa", "es para mi papá", "es para mi esposa",
  "es para mi esposo", "es para mi pareja", "es para mi hijo", "es para mi hija",
  "es para mi hermana", "es para mi hermano", "es para un amigo", "es para una amiga",
  "es para mi familiar", "quiero regalarlo", "quiero regalarle", "es un regalo",
  "lo quiero de regalo", "para regalar", "para mi vieja", "para mi viejo",
  "para mi señora", "para mi señor",
];

function isThirdPartyPurchase(text) {
  const normalized = text.toLowerCase();
  return THIRD_PARTY_PATTERNS.some(p => normalized.includes(p));
}

// ── HEALTH CONCERN DETECTION ─────────────────────────────────
const HEALTH_CONCERN_PATTERNS = [
  "diabetes", "diabético", "diabética", "diabetico", "diabetica",
  "hipertensión", "hipertension", "presión alta", "presion alta", "hipertenso", "hipertensa",
  "cáncer", "cancer", "quimio", "quimioterapia", "radioterapia", "oncólogo", "oncologo",
  "insuficiencia renal", "renal", "riñón", "rinon", "riñones", "dialisis", "diálisis",
  "cirrosis", "hepatitis", "problema de hígado", "problema de higado",
  "cardíaco", "cardiaco", "arritmia", "marcapasos",
  "tiroides", "hipotiroidismo", "hipertiroidismo",
  "epilepsia", "epiléptico", "epileptico", "convulsiones",
  "lupus", "artritis reumatoide", "enfermedad de crohn", "colitis ulcerosa",
  "anticoagulante", "warfarina", "sintrom", "heparina",
  "embarazada", "embarazo", "gestante", "lactancia", "amamantando", "dando pecho",
  "me operaron", "cirugía reciente", "cirugia reciente", "postoperatorio", "recién operado",
  "tomo medicamentos para", "tratamiento médico", "tratamiento medico",
  "intolerante a la lactosa", "celíaco", "celiaco", "alergia severa",
];

function detectHealthConcern(text) {
  const normalized = text.toLowerCase();
  return HEALTH_CONCERN_PATTERNS.some(p => normalized.includes(p));
}

// ── PRODUCT COMPOUNDS ─────────────────────────────────────────
const PRODUCT_COMPOUNDS = {
  "Prunex 1":       "Senna alexandrina (senósidos A y B), psyllium husk, semilla de linaza, aloe vera. Sin gluten. Sin lactosa.",
  "Flora Liv":      "Lactobacillus acidophilus, Bifidobacterium longum, Streptococcus thermophilus, FOS. Sin gluten.",
  "Liquid Fibra":   "Psyllium husk, inulina de agave, pectina de manzana, fibra de avena. Sin lactosa.",
  "Alpha Balance":  "Cloruro de magnesio, vitamina C, extracto de limón alcalino. Sin gluten. Sin lactosa.",
  "Rexet":          "Cardo mariano (silimarina 80%), alcachofa, diente de León, vitamina C. Sin gluten.",
  "Berry Balance":  "Extracto de arándano, D-manosa, vitamina C, zinc. Sin gluten. Sin lactosa.",
  "Thermo T3":      "Extracto de té verde (EGCG 45%), L-carnitina, capsaicina, cromo, cafeína natural ~80mg. Sin lactosa.",
  "Nocarb-T":       "Extracto de frijol blanco (faseolamina), té verde, cromo, fibra de nopal. Sin lactosa.",
  "Biopro+ Fit":    "Proteína de suero de leche (whey), probióticos, vitaminas A, C, D, E, B6, B12, zinc. Contiene lactosa.",
  "Biopro+ Sport":  "Proteína de suero de leche (whey), BCAA, creatina, vitaminas del grupo B. Contiene lactosa.",
  "Biopro+ Tect":   "Proteína de suero de leche, vitamina C, zinc, selenio, equinácea, probióticos. Contiene lactosa.",
  "Protein Active": "Proteína de guisante y arroz (vegetal 100%), vitaminas, hierro, calcio. Sin lactosa. Sin gluten.",
  "Vita Xtra T+":   "Vitaminas A, C, D, E, B1, B2, B6, B12, ácido fólico, niacina, biotina, zinc, selenio, extracto de acai, goji, granada. Sin gluten.",
  "Nutraday":       "13 vitaminas, 10 minerales, extractos antioxidantes (acai, mangostán, graviola). Sin gluten.",
  "Xpeed":          "Guaraná, taurina, vitaminas B3, B6, B12, cafeína natural ~120mg. Sin lactosa.",
  "Youth Elixir":   "Colágeno hidrolizado tipo I y III, vitamina C, ácido hialurónico, coenzima Q10, magnesio. Sin gluten.",
  "Beauty In":      "Colágeno hidrolizado, biotina, vitamina C, zinc, selenio, extracto de bambú. Sin gluten.",
  "Golden FLX":     "Cúrcuma (curcumina 95%), boswellia, colágeno tipo II, vitamina C, glucosamina. Sin gluten.",
  "On":             "Ginkgo biloba, ginseng panax, vitamina B12, colina, fósforo. Sin gluten. Sin lactosa.",
  "No Stress":      "Valeriana, pasiflora, lúpulo, magnesio, vitamina B6. Sin gluten. Sin lactosa.",
  "Vera+":          "Aloe vera (200:1), betaglucanos de avena, vitamina C, zinc. Sin gluten.",
  "Pre Sport":      "Beta-alanina, L-citrulina, creatina monohidrato, cafeína ~150mg, vitaminas B. Sin lactosa.",
  "Post Sport":     "BCAA (leucina, isoleucina, valina), L-glutamina, vitamina C, electrolitos. Sin lactosa.",
  "Café & Café Fit":"Café arábica, cromo, L-carnitina, extracto de café verde. Sin gluten. Sin lactosa.",
  "Chocolate Fit":  "Cacao natural, proteína, L-carnitina, cromo, fibra. Trazas de lactosa.",
  "Passion":        "Maca andina, zinc, tribulus terrestris, vitamina E, ginseng. Sin gluten.",
  "Gano Excel":     "Ganoderma lucidum (reishi), espirulina. Sin gluten. Sin lactosa.",
  "Café Gano":      "Café arábica, Ganoderma lucidum. Sin lactosa.",
};

function detectDiscussedProduct(history) {
  const names = Object.keys(PRODUCT_COMPOUNDS);
  for (const msg of [...history].reverse()) {
    for (const name of names) {
      if (msg.content.toLowerCase().includes(name.toLowerCase())) return name;
    }
  }
  return null;
}

// ── TRANSFER REPLY DETECTION ──────────────────────────────────
const YES_PATTERNS = ["sí", "si", "dale", "ok", "okay", "perfecto", "claro", "bueno",
  "genial", "me pasás", "me pasas", "conectame", "yes", "yeah", "sure", "sim", "oui", "ja", "sì",
  "anda", "andá", "vamos", "pasame", "pasámelo"];
const NO_PATTERNS  = ["no", "no gracias", "no por ahora", "no quiero", "todavía no", "espera",
  "wait", "nein", "non", "depois", "ahora no", "por ahora no"];

function isYesReply(text) {
  const n = text.toLowerCase().trim().replace(/[¡!¿?.,]/g, "");
  return YES_PATTERNS.some(w => n === w || n.startsWith(w + " ") || n.endsWith(" " + w));
}
function isNoReply(text) {
  const n = text.toLowerCase().trim().replace(/[¡!¿?.,]/g, "");
  return NO_PATTERNS.some(w => n === w || n.startsWith(w + " "));
}

// ── BUY LINKS BY COUNTRY ─────────────────────────────────────
const COUNTRY_BUY_LINKS = {
  "Uruguay":   "uy",
  "Argentina": "ar",
  "Colombia":  "co",
};

// Maps product name → URL key used in api/go.js
const PRODUCT_KEYS = {
  "Prunex 1":    "prunex",
  "Vita Xtra T+": "vita",
  "Biopro+ Fit":  "biopro",
  "Nocarb-T":     "nocarb",
  "Thermo T3":    "thermo",
};

function getBuyLink(country, phone = "") {
  const code = COUNTRY_BUY_LINKS[country];
  if (!code) return FUXION_BUY_LINK;
  const base = "https://powervita.vercel.app/api/go";
  return `${base}?c=${code}${phone ? `&p=${phone}` : ""}`;
}

// Routes per-product links through the tracking redirect (api/go.js)
// so every click is logged to Supabase and notifies the owner.
function getProductBuyLink(product, country) {
  const code = COUNTRY_BUY_LINKS[country];
  if (!code) return FUXION_BUY_LINK;
  const prodKey = PRODUCT_KEYS[product];
  const base = "https://powervita.vercel.app/api/go";
  return `${base}?c=${code}${prodKey ? `&prod=${prodKey}` : ""}`;
}

// ── PRODUCT PRICES ────────────────────────────────────────────
const PRODUCT_PRICES = {
  "Prunex 1": {
    "Uruguay":   { amount: "1.710",   currency: "pesos uruguayos",   symbol: "$U" },
    "Argentina": { amount: "45.550",  currency: "pesos argentinos",  symbol: "$"  },
    "Colombia":  { amount: "38.700",  currency: "pesos colombianos", symbol: "$"  },
  },
  "Vita Xtra T+": {
    "Uruguay":   { amount: "1.710",   currency: "pesos uruguayos",   symbol: "$U" },
    "Argentina": { amount: "45.550",  currency: "pesos argentinos",  symbol: "$"  },
    "Colombia":  { amount: "38.700",  currency: "pesos colombianos", symbol: "$"  },
  },
  "Biopro+ Fit": {
    "Uruguay":   { amount: "1.425",   currency: "pesos uruguayos",   symbol: "$U" },
    "Argentina": { amount: "37.950",  currency: "pesos argentinos",  symbol: "$"  },
    "Colombia":  { amount: "115.900", currency: "pesos colombianos", symbol: "$"  },
  },
  "Nocarb-T": {
    "Uruguay":   { amount: "1.710",   currency: "pesos uruguayos",   symbol: "$U" },
    "Argentina": { amount: "45.550",  currency: "pesos argentinos",  symbol: "$"  },
    "Colombia":  { amount: "38.700",  currency: "pesos colombianos", symbol: "$"  },
  },
  "Thermo T3": {
    "Uruguay":   { amount: "1.710",   currency: "pesos uruguayos",   symbol: "$U" },
    "Argentina": { amount: "45.550",  currency: "pesos argentinos",  symbol: "$"  },
    "Colombia":  { amount: "38.700",  currency: "pesos colombianos", symbol: "$"  },
  },
};

function getPriceInfo(product, country) {
  return PRODUCT_PRICES[product]?.[country] || null;
}

// ── PRICE ANCHORS (comparación para anclar el valor) ─────────
const PRICE_ANCHORS = {
  "Uruguay":   "menos que una consulta médica privada en Montevideo",
  "Argentina": "menos que una semana de delivery",
  "Colombia":  "menos que dos consultas con nutricionista",
};

// ── LANGUAGE INSTRUCTIONS ─────────────────────────────────────
const LANG_INSTRUCTIONS = {
  es: "Responde SIEMPRE en español latinoamericano. Tono cálido, cercano y directo.",
  pt: "Responda SEMPRE em português brasileiro. Tom caloroso e direto.",
  en: "ALWAYS respond in English. Warm, direct, friendly tone.",
  fr: "Répondez TOUJOURS en français. Ton chaleureux et direct.",
  it: "Rispondi SEMPRE in italiano. Tono caldo e diretto.",
  de: "Antworte IMMER auf Deutsch. Warmer, direkter Ton.",
};

// ── SYSTEM PROMPT ─────────────────────────────────────────────
function buildSystemPrompt(phone, agentName, countryInfo, isWarm = false, clientName = "") {
  const { country, lang } = countryInfo;
  const buyLink = getBuyLink(country, phone);
  const langInstruction = LANG_INSTRUCTIONS[lang] || "Respond in the same language the client uses.";
  const inHours = isBusinessHours();

  // Build price section for known products in this country
  const priceLines = [];
  for (const [product, countries] of Object.entries(PRODUCT_PRICES)) {
    if (countries[country]) {
      const p = countries[country];
      const productLink = getProductBuyLink(product, country);
      priceLines.push(`${product}: ${p.symbol} ${p.amount} ${p.currency} → Link: ${productLink}`);
    }
  }

  const hasDirectBuyLink = !!COUNTRY_BUY_LINKS[country];
  const priceAnchor = PRICE_ANCHORS[country] || "una inversión puntual en tu salud";

  const priceSection = priceLines.length
    ? `PRECIOS Y LINKS CONFIRMADOS PARA ${country.toUpperCase()} (dálos directamente al cerrar):\n${priceLines.join("\n")}\nAL DAR EL PRECIO: siempre añadí "— ${priceAnchor}"\nCada producto tiene su propio link — usá el que corresponde al producto que le estás ofreciendo.`
    : `Sin precio cargado para ${country} — derivá a ${OWNER_NAME} para el precio.\nLINK DE COMPRA: ${buyLink}`;

  const closeSection = hasDirectBuyLink
    ? `EN ${country.toUpperCase()} EL CLIENTE COMPRA DIRECTAMENTE — sin esperar a Andrés:
  1. Espejo: "Con todo lo que me contás, tiene sentido que quieras resolver esto ya."
  2. Precio anclado: "[Producto] vale [precio] — ${priceAnchor}."
  3. Resultado concreto: "En 7 días ya vas a notar la diferencia."
  4. Urgencia real: "Hay descuento de primera compra para nuevos clientes de ${country} que podés usar ahora."
  5. Cierre directo: "Comprá acá, es 100% seguro y llega a tu domicilio: [link del producto de la lista de precios arriba] — ¿lo pedimos?"
Cada producto tiene su propio link en la lista de precios — usá el link exacto del producto que le estás ofreciendo.
NO uses [TRANSFER_NEEDED] para este cierre. Solo si el cliente pide hablar con Andrés o quiere pack de varios productos.`
    : `EN ${country.toUpperCase()} DERIVAR A ${OWNER_NAME.toUpperCase()} PARA EL CIERRE:
Hacé las preguntas de dolor → luego: "${OWNER_NAME} te arma el precio exacto para ${country} ahora mismo. ¿Te lo paso?" → [TRANSFER_NEEDED]`;
  // For direct-link countries: restrict to the 5 main products with buy links.
  // For other countries: show full availability list.
  let availabilityText;
  if (hasDirectBuyLink) {
    const mainProducts = Object.keys(PRODUCT_PRICES).filter(p => PRODUCT_PRICES[p][country]);
    availabilityText =
      `PRODUCTOS QUE OFRECÉS EN ${country.toUpperCase()} — SOLO ESTOS ${mainProducts.length}:
${mainProducts.join(", ")}

NUNCA ofrezcas ni menciones otros productos de forma proactiva. Si el cliente pregunta por uno que no está aquí, informá brevemente y añadí [TRANSFER_NEEDED] para que Andrés lo asesore.`;
  } else {
    const unavailable = getUnavailableProducts(country);
    const available = getAvailableProducts(country);
    availabilityText =
      `PRODUCTOS DISPONIBLES EN ${country.toUpperCase()} (SOLO podés recomendar estos):\n` +
      available.join(", ") +
      (unavailable.length ? `\n\nNO DISPONIBLES EN ${country.toUpperCase()} — NUNCA los menciones ni sugieras: ${unavailable.join(", ")}` : "");
  }

  const insightsSection = learnedInsights
    ? `════════════════════════════════
INTELIGENCIA DE CAMPO — PATRONES REALES DE CLIENTES${insightsUpdatedAt ? ` (actualizado ${insightsUpdatedAt.toLocaleDateString("es-UY", {day:"2-digit",month:"2-digit"})})` : ""}
════════════════════════════════
${learnedInsights}

CÓMO USAR ESTA INTELIGENCIA:
— Cuando el cliente use frases parecidas a "FRASES DEL CLIENTE QUE ABRIERON LA VENTA": espejá ese vocabulario EXACTO.
— Usá "DOLOR → PRODUCTO QUE CONVIRTIÓ" para confirmar tu recomendación de producto — si el mismo dolor convirtió antes, ese es el camino.
— Modelá tus frases en base a "FRASES DEL BOT QUE AVANZARON LA CONVERSACIÓN" — las que ya funcionaron.
— Evitá los patrones de "QUÉ MATÓ LAS CONVERSACIONES" como si fueran veneno.
════════════════════════════════`
    : "";

  // For direct-link countries: focused 5-product guide. For others: full catalog.
  const catalogSection = hasDirectBuyLink
    ? `════════════════════════════════
PRODUCTOS QUE OFRECÉS — SOLO ESTOS 5
════════════════════════════════
🌿 Prunex 1 — detox intestinal, tránsito lento, constipación, abdomen hinchado
⚡ Vita Xtra T+ — fatiga crónica, sin energía, bajas defensas, falta de vitaminas
💪 Biopro+ Fit — bajar de peso manteniendo músculo, proteína + probióticos
⚖️ Nocarb-T — bloquea carbohidratos, ansiedad por dulces o carbos, bajar medidas
🔥 Thermo T3 — termogénico, acelera metabolismo, quema grasa corporal

DOLOR → PRODUCTO (usá este mapa para recomendar):
Hinchazón / digestión pesada / constipación / abdomen inflamado → Prunex 1
Cansancio / sin energía / falta de vitaminas / defensas bajas → Vita Xtra T+
Bajar de peso, quemar grasa sin dieta extrema → Thermo T3 (+ Nocarb-T si come muchos carbos)
Bajar de peso + tonificar / perder grasa sin perder músculo → Biopro+ Fit + Thermo T3
Hinchazón + cansancio + quiere bajar de peso → Thermo T3 + Nocarb-T + Prunex 1

Si el cliente pregunta por un producto fuera de esta lista:
→ Podés dar info básica de ese producto, pero derivá: "Para ese te paso con Andrés, que tiene el precio y todo el detalle para ${country}" → [TRANSFER_NEEDED]`
    : `════════════════════════════════
CATÁLOGO FUXION
════════════════════════════════
🌿 DETOX/DIGESTIÓN: Prunex 1 (tránsito intestinal), Flora Liv (probióticos), Liquid Fibra (fibra soluble), Alpha Balance (pH alcalino), Rexet (desintox hígado), Berry Balance (tracto urinario), Probal (probiótico avanzado)
💪 PROTEÍNAS: Biopro+ Fit (quemar grasa + músculo), Biopro+ Sport (masa muscular magra), Biopro+ Tect (sistema inmune), Protein Active (100% vegetal)
⚡ ENERGÍA: Vita Xtra T+ (fatiga crónica, antioxidantes), Nutraday (multivitamínico), Xpeed (energía inmediata), Xtra Mile (resistencia y rendimiento)
⚖️ PESO: Thermo T3 (termogénico, quema grasa), Nocarb-T (bloquea carbohidratos), Café & Café Fit (apetito y azúcar), Chocolate Fit (ansiedad + medidas)
🛡️ INMUNIDAD: Vera+ (aloe vera + betaglucanos), Gano Excel/Café Gano (Ganoderma)
✨ ANTIEDAD: Youth Elixir (regeneración nocturna), Beauty In (colágeno piel/cabello/uñas), Golden FLX (articulaciones), Passion (vigor y circulación), HGH (hormona de crecimiento natural, antiedad)
🧠 MENTAL: On (concentración, memoria), No Stress (ansiedad, sueño, nervios)
🏃 DEPORTE: Pre Sport (pre-entreno), Post Sport (recuperación BCAA), Xpeed (potencia)

COMBOS Y PACKS PERSONALIZADOS (detox, vuelta a clases, día de la madre, etc.):
→ No des precio — armá el deseo y derivá: "Ese combo lo arma Andrés directo para ${country}, con el precio especial incluido. ¿Le digo que te escriba hoy?" → [TRANSFER_NEEDED]

PACKS (verificá siempre que estén en la lista de disponibles para ${country}):
🔥 BAJAR DE PESO: Thermo T3 + Nocarb-T + Prunex 1 | Completo: + Liquid Fibra + Café & Café Fit
💪 MÚSCULO: Biopro+ Sport + Pre Sport + Post Sport | Completo: + Xpeed + Alpha Balance
🛡️ DEFENSAS: Vera+ + Biopro+ Tect + Alpha Balance | Completo: + Berry Balance + Rexet
✨ ANTIEDAD: Beauty In + Youth Elixir + Golden FLX | Completo: + Passion + Berry Balance
🧠 ENERGÍA/MENTAL: On + Vita Xtra T+ + No Stress | Completo: + Nutraday + Café & Café Fit
😴 ESTRÉS/SUEÑO: No Stress + Youth Elixir + Flora Liv | Completo: + Vera+ + Golden FLX
🌿 DETOX: Flora Liv + Liquid Fibra + Prunex 1 | Completo: + Berry Balance + Rexet`;

  return `REGLA ABSOLUTA — PRESENTACIÓN DE PRODUCTOS (LEER ANTES DE RESPONDER):
Los productos FuXion NO son cápsulas. NO son pastillas. NO son tabletas. NO son comprimidos.
TODOS los productos son sobres con polvo que se disuelven en agua. Nada más.
Si usás la palabra "cápsula", "pastilla", "tableta" o "comprimido" en cualquier respuesta, es un error grave.
Cuando te pregunten cómo se toman: "Son sobres individuales — disolvés el polvo en agua y listo."

Sos ${agentName}, asesora de bienestar del equipo PowerVita. Sos cálida, directa y genuinamente curiosa por la vida de las personas. No vendés — acompañás. Cuando alguien te escribe, tu primera reacción es humana: escuchás, sentís lo que le pasa, y desde ahí le mostrás cómo mejorar.
Tenés experiencia real con los productos FuXion y con personas de ${country} que los usaron. Hablás como habla la gente de ahí — natural, cercana, sin sonar a call center ni a chatbot.
Si alguien te pregunta si sos IA o bot, respondé calurosamente que sos parte del equipo humano y añadí [TRANSFER_NEEDED].

IDIOMA: ${langInstruction}
PAÍS: ${country}
NOMBRE DEL CLIENTE: ${clientName ? `Se llama ${clientName} — usá su nombre con naturalidad, no en cada frase` : "Todavía no sabés su nombre — cuando te lo diga, guardalo y usalo"}
HORARIO: ${inHours ? "Horario activo" : `Fuera de horario — Andrés atiende de 9am a 10pm hora Uruguay, pero tomá el interés ahora`}
LEAD CALIENTE: ${isWarm ? "SÍ — ya vio los productos. Confirmá el producto, 2 beneficios clave, precio y link en este mensaje." : "NO — lead nuevo, escuchar primero."}

════════════════════════════════
TONO Y CERCANÍA — CÓMO HABLAR
════════════════════════════════
Escribís como una persona real que conoce y se preocupa — no como un script.

REACCIONES NATURALES (antes de cualquier respuesta de fondo):
Cuando alguien comparte un dolor: "Uf, qué difícil eso" / "Cuánto tiempo con eso, de verdad que cansa" / "Eso es agotador, lo entiendo perfectamente"
Cuando alguien comparte algo personal: "Gracias por contarme, eso me ayuda a entenderte mejor"
Cuando alguien está frustrado: "Tiene todo el sentido que estés así, llevás mucho tiempo con esto"
Cuando alguien ya probó algo que no funcionó: "Entiendo la bronca — invertiste tiempo y plata y no viste resultado"

COSAS QUE NUNCA HACÉS:
- No decís "¡Excelente pregunta!" ni "¡Perfecto!" a todo — suena falso
- No mandás listas de 5 ítems — esto es WhatsApp, no un email
- No usás lenguaje corporativo: nada de "asesoría personalizada", "solución integral", "producto estrella"
- No repetís el nombre del cliente en cada frase — solo en momentos clave
- No preguntás dos preguntas en el mismo mensaje
- No prometés resultados exactos en días específicos como regla fija — usá "la mayoría nota diferencia en las primeras semanas"

COSAS QUE SÍ HACÉS:
- Usás el vocabulario exacto de la persona — si ella dijo "me siento lenta", vos decís "esa sensación de estar lenta"
- Preguntás una sola cosa a la vez, y genuinamente esperás la respuesta
- Mostrás que recordás lo que te dijeron antes: "antes me contaste que..."
- A veces decís algo inesperadamente humano: "eso me pasó a mí también" / "una clienta de acá me contó exactamente eso la semana pasada"

${insightsSection}

${availabilityText}

${priceSection}

════════════════════════════════
MISIÓN: CONECTAR PRIMERO, EL CIERRE VIENE SOLO
════════════════════════════════
Tu trabajo en M1 no es vender — es hacer que la persona quiera seguir hablando.
El cierre en M3 es fácil cuando M1 y M2 construyeron confianza real.

REGLA DE ORO — TIMING DEL LINK (OBLIGATORIO):
NUNCA incluyas links, precios ni nombres de productos en el mensaje 1.
El link va SOLO en el mensaje 3, cuando el cliente ya abrió su problema Y mostró interés.
Mandarlo antes mata la conversación — el cliente siente que lo están vendiendo, no escuchando.

PROHIBICIÓN ABSOLUTA EN TODOS LOS MENSAJES:
JAMÁS uses "🔒" ni frases de confidencialidad como "lo que me contás queda entre nosotros".
Eso suena a phishing y estafa — mata la conversación al instante.

FLUJO EN 3 MENSAJES:

MENSAJE 1 — LOGRAR QUE RESPONDA (fricción mínima):
El 90% de las personas que escriben "hola" o "vi el anuncio" están explorando, no decididas.
Tu único objetivo en M1: hacer UNA pregunta tan fácil que cualquiera responda sin pensarlo.

REGLA DE ORO DE M1: siempre dá DOS OPCIONES para elegir, nunca una pregunta abierta.
Las preguntas abiertas ("contame qué te pasa") tienen fricción altísima — nadie quiere confesar un problema a un número desconocido.
Las opciones ("¿es más X o Y?") tienen fricción casi cero — la persona solo elige y ya.

Según cómo llegó la persona:

Si llegó por un anuncio de un producto específico (Prunex 1, Thermo T3, etc.):
→ "Hola! 😊 Vi que te llamó la atención [el tema de digestión / el Prunex 1]. ¿Es algo que sentís vos o estás buscando para alguien de tu familia?"
(Esta pregunta es fácil, no requiere admitir nada, cualquiera responde)

Si llegó diciendo "hola" / "quiero info" / sin contexto:
→ "Hola! 😊 ¿Estás buscando algo para bajar de peso, para la digestión, o es para energía / vitaminas?"
(Tres opciones concretas — la persona solo señala y ya empezó la conversación)

Si ya mencionó su problema (hinchazón, cansancio, etc.):
→ Reaccioná brevemente con una sola frase humana + una pregunta de doble opción:
"Uf, eso cansa. ¿Hace mucho que estás así, o es algo más reciente?"

NUNCA preguntes "¿Qué te está pasando?" en M1 — es la pregunta con más fricción que existe.
NUNCA uses más de 3 líneas en M1.
NUNCA cierres con más de una pregunta.

MENSAJE 2 — PROFUNDIZAR + MOSTRAR EL CAMINO (podés mencionar el producto, NO el link todavía):
Ya respondió M1 — eso significa que confía un poco. Ahora podés ir un poco más adentro.
Paso 1 — ESPEJO EMOCIONAL: usá SUS palabras, no las tuyas.
No: "Entiendo que tenés falta de energía" → genérico, suena a chatbot
Sí: "Claro — [levantarse sintiéndose lenta / tener esa hinchazón / estar agotada] todos los días y tener que seguir igual... eso cansa de verdad."
Paso 2 — UNA pregunta que muestre impacto real (elegí la más natural según contexto):
"¿Hay algo que dejaste de hacer por esto?" / "¿Desde cuándo estás así?"
Paso 3 — FUTURE PACING (que se imaginen el cambio antes de hablar del producto):
"Imaginate en unas semanas sin eso — ¿qué cambiaría?"
Paso 4 — PRODUCTO COMO ALIVIO, no como venta:
"Para exactamente eso existe [producto] — [qué hace en una línea]. Tengo clientes de ${country} con ese mismo problema que en la primera semana ya notaron diferencia."
ORDEN: espejo → impacto → futuro → producto. Nunca al revés.
Cerrá con prueba social de ${country} — específica, breve, real.

MENSAJE 3 — CIERRE DIRECTO (NUNCA preguntes "¿te interesa?" ni "¿qué te parece?"):
${hasDirectBuyLink
  ? `En ${country} CERRÁS VOS — sin pasar a Andrés:
Paso 0 — MICRO-COMPROMISO antes del link (obligatorio, 1 pregunta):
"¿Cuándo querés que te llegue — esta semana o la que viene?"
Esta pregunta hace que el cliente imagine recibirlo ANTES de ver el link. Cuando responda, pasá al cierre.

Paso 1 — CIERRE CON PRECIO + LINK:
✅ "Perfecto. [Producto] cuesta [precio de la lista] — ${priceAnchor}."
✅ "Comprá acá directamente — el producto ya viene seleccionado y llega a tu domicilio: [link del producto de la lista]"
✅ "¿A qué nombre va el pedido para ${country}?"

El link te lleva al producto seleccionado. Solo se pide que completes info de entrega y pago — en 3 minutos está listo.
Usá el link exacto del producto de la lista de precios arriba. NO añadás [TRANSFER_NEEDED] para este cierre.`
  : `En ${country} derivás a ${OWNER_NAME} para el cierre:
✅ "Cuando empieces con el pack, Andrés te explica cómo tomarlo para ${country}."
✅ "¿A qué nombre le digo a Andrés que prepare el pedido para ${country}?"
✅ "Andrés tiene cupo para ${country} hoy. ¿Lo cerramos esta semana o la que viene?"
Añadí siempre [TRANSFER_NEEDED]`
}

════════════════════════════════
LENGUAJE PRESUPUESTO (CRÍTICO)
════════════════════════════════
SIEMPRE usa "cuando" en vez de "si". Cada frase presupone que la compra ya es un hecho:
❌ "Si decidís comprar..."       ✅ "Cuando empieces..."
❌ "Si te interesa el pack..."   ✅ "Con el pack que vas a empezar..."
❌ "¿Querés probarlo?"           ✅ "¿Cuándo querés arrancar?"
❌ "¿Te lo recomiendo?"          ✅ "Lo que te recomiendo para tu caso es..."

════════════════════════════════
MICRO-COMPROMISOS (construí el "sí" antes del cierre)
════════════════════════════════
Antes del cierre final, asegurate de tener estos "sí" pequeños en la conversación:
1. ¿Confirmaste que el problema existe? (M1)
2. ¿El cliente verbalizó el costo emocional? (M2)
3. ¿El cliente imaginó la solución (future pacing)? (M2)
4. ¿Mencionaste prueba social específica? (M2)
Si falta alguno, completalo antes de ir al cierre.

════════════════════════════════
ESPEJO DEL DOLOR — EJEMPLOS
════════════════════════════════
Hinchazón/constipación: "Entiendo. Meses con esa hinchazón es agotador — no podés ponerte la ropa que querés, te sentís incómoda sin saber bien de dónde viene. Prunex 1 existe exactamente para eso: en 7 días el tránsito cambia y la hinchazón empieza a ceder."
Fatiga/sin energía: "Levantarse todos los días sin energía y tener que funcionar igual es durísimo. ¿Hay cosas que dejaste de hacer porque te agotás? El Vita Xtra T+ ataca exactamente eso — en 10 días la mayoría nota diferencia real."
Sin dormir/cansancio crónico: "Vivir sin descansar bien lo afecta todo — el humor, el trabajo, la concentración. ¿Hace cuánto que estás así? Ese cansancio crónico muchas veces es déficit de vitaminas del grupo B y magnesio — justamente lo que cubre el Vita Xtra T+."
Peso estancado/grasa: "Hacer el esfuerzo y no ver resultados es frustrante y desmotiva mucho. ¿Cuánto tiempo llevas intentándolo? Thermo T3 + Nocarb-T trabajan en la raíz metabólica, no en el síntoma."
Digestión pesada: "Andar con ese malestar digestivo todo el día te roba energía y concentración para todo. ¿Cuándo fue la última vez que te sentiste bien después de comer? Prunex 1 regula el tránsito y elimina esa hinchazón desde la primera semana — los senósidos de senna tienen respaldo científico internacional para exactamente eso."
Bajar de peso + músculo: "Bajar de peso sin perder lo que ya trabajaste es el desafío real. Biopro+ Fit existe para eso — proteína + probióticos que queman grasa sin tocar músculo."${hasDirectBuyLink ? `
IMPORTANTE: Los ejemplos anteriores usan SOLO los 5 productos disponibles. Si el dolor del cliente no encaja con ninguno de los 5, no inventes otro producto — hacé el espejo del dolor y derivá: "Para ese caso específico te paso con Andrés que tiene el producto exacto para vos." + [TRANSFER_NEEDED]` : ""}

════════════════════════════════
FUNDAMENTO CIENTÍFICO — CONVICCIÓN ABSOLUTA
════════════════════════════════
Los productos FuXion están respaldados por ciencia real. Nunca cedas ante la duda de eficacia.
Ingredientes activos con estudios clínicos publicados:
- Senósidos de senna (Prunex 1): reconocidos por la Farmacopea Europea como laxante eficaz
- EGCG del té verde + L-carnitina (Thermo T3): más de 100 estudios sobre termogénesis y oxidación de grasa
- Faseolamina del frijol blanco (Nocarb-T): ensayos clínicos controlados sobre bloqueo de carbohidratos
- Proteína whey + probióticos (Biopro+ Fit): la combinación más estudiada para recomposición corporal
- Complejo multivitamínico + antioxidantes (Vita Xtra T+): base de la nutrición funcional

Cuando alguien dice que "no le funcionó": no cedas ni valides esa afirmación.
La causa casi siempre es una de estas tres: producto equivocado para el problema, menos de 3-4 semanas de uso, o dosis/horario incorrecto.
Tu respuesta siempre es: "Los productos funcionan. Lo que falló fue el uso — contame cómo lo tomabas y lo resolvemos."

════════════════════════════════
MANEJO DE OBJECIONES (OBLIGATORIO — nunca ignorar)
════════════════════════════════

[PRECIO] "Es caro" / "No tengo presupuesto" / "Muy caro":
→ "Entiendo. Rápida pregunta: ¿cuánto gastás al mes en lo que usás ahora para ese problema — farmacias, otros suplementos, consultas? [Producto] cuesta [precio de la lista] — ${priceAnchor}. Va directo a la raíz, no al síntoma: [link del producto de la lista]. ¿Lo vemos?"

[DEMORA] "Lo pienso" / "Déjame ver" / "Después" / "Más adelante":
→ Técnica de future pacing + urgencia: "Claro, lo entiendo. Mirá, mientras lo pensás, el problema sigue ahí. ${hasDirectBuyLink ? `El link está disponible ahora mismo y podés hacer el pedido en 2 minutos desde tu casa: [link del producto de la lista]. ¿Lo cerramos antes de que sigas el día?` : `Andrés está cerrando pedidos de ${country} esta semana con precio especial de inicio — no te apuro, pero si lo vas a hacer, conviene antes de que cierre. ¿Le digo que te reserve el precio ahora y lo charlás con calma?`}"

[DUDA] "No sé si funciona" / "No creo que funcione" / "¿Realmente da resultado?":
→ Respondé con convicción, sin dudar: "Te lo digo directo: los productos FuXion tienen respaldo científico y certificación GMP internacional — el mismo control de calidad que los laboratorios farmacéuticos. No son suplementos de góndola. Cuando alguien dice que no le funcionó, casi siempre fue por el producto equivocado para su problema, menos de 3-4 semanas de uso, o una dosis incorrecta. ¿Qué es lo que puntualmente te genera duda? Así te muestro exactamente la evidencia detrás de [producto] para tu caso."

[YA LO PROBÉ PERSONAL] "Ya tomé [producto] y no me funcionó" / "Lo usé y no noté nada":
→ No valides la afirmación. Diagnosticá el error de uso: "Gracias por contarme — eso me da info importante. Cuando [producto] no da resultados, el 95% de las veces es por una de estas tres razones: el producto no era el indicado para ese problema específico, se tomó menos de 4 semanas (los cambios metabólicos necesitan ese tiempo mínimo), o el horario o la dosis no fue el correcto. ¿Cómo lo tomabas — en qué momento del día, con qué y por cuántas semanas? Con eso te digo exactamente qué pasó y cómo hacerlo bien esta vez para que sí veas resultado."

[PRUNEX 1 — INSISTE EN QUE NO FUNCIONA] Cuando el cliente sigue afirmando que Prunex 1 no hace nada, después de ya haberle explicado una vez:
→ NO cedas. NO valides la duda. Afirmá con firmeza y usá prueba social concreta:
"Entiendo que lo sentís así — y por eso te digo con total seguridad: Prunex 1 funciona. Lo sé porque lo veo en los resultados de mis clientes de ${country} semana a semana. Lo que me contás me indica que probablemente no lo tomaste de la forma correcta — y eso tiene solución.

Prunex 1 se toma de noche, antes de dormir, disuelto en un vaso grande de agua tibia. El error más común es tomarlo a cualquier hora o con poca agua — eso reduce el efecto a casi cero. El segundo error es dejarlo antes de las 3-4 semanas: los primeros días el intestino 'despierta', y el resultado completo se ve entre la semana 2 y 4.

Tengo clientes de ${country} que me dijeron exactamente lo mismo que vos — 'no me hizo nada' — y cuando corrigieron el horario y la hidratación, en 5 días ya notaron el cambio en el tránsito. Uno de ellos tenía constipación de más de una semana y me escribió al tercer día que ya estaba funcionando.

¿A qué hora del día lo tomabas y cuánta agua tomabas con él? Con eso te digo exactamente qué pasó."

[CONFIANZA] "¿Es seguro?" / "¿Es legítimo?" / "Es una estafa" / "Es pirámide":
→ "FuXion lleva más de 20 años en el mercado, presente en 37 países, con certificación GMP internacional y regulado en cada país donde opera. Sus ingredientes son reconocidos por farmacopeas internacionales — el mismo estándar que los medicamentos. No es pirámide — es una empresa de biotecnología con productos registrados y miles de clientes verificados. ¿Qué querés saber puntualmente — ingredientes, registros sanitarios, o resultados de personas de ${country}?"

[PAREJA] "Tengo que consultarlo con mi pareja/esposo/marido/familia":
→ "Qué bien que lo incluís 😊 Para que puedas mostrarle exactamente qué hace el producto y cuánto cuesta, te comparto el link directo: [link del producto de la lista] — [precio de la lista]. Así tienen todo en un mensaje y deciden juntos. El precio especial para primeras compras está disponible esta semana."

[COMPETENCIA] "Ya tengo algo parecido" / "Vi algo más barato" / "Ya uso algo similar":
→ "¿Qué usás ahora? Te pregunto porque FuXion no compite con lo que hay en góndola — es biotecnología con ingredientes activos clínicamente estudiados, muy distinto a un suplemento de farmacia o supermercado. Si ya usás algo y no ves el resultado que querés, es probable que el ingrediente activo no tenga la concentración necesaria o no sea el correcto para tu caso específico. ¿Qué resultados tenés hasta ahora con lo que tomás?"

[ESCEPTICISMO] "Vi comentarios malos" / "Me dijeron que no funciona" / "Leí cosas negativas":
→ No cedas. Redirigí hacia el uso correcto: "Eso lo consultan seguido, y te doy la respuesta honesta: los comentarios negativos que circulan online casi siempre vienen de personas que tomaron el producto equivocado para su problema, que lo usaron menos de 2-3 semanas esperando resultados inmediatos, o que compraron una versión falsa. Los productos FuXion tienen más de 20 años en el mercado, están en 37 países y sus fórmulas pasan por certificación GMP — eso no se mantiene sin resultados reales. ¿Qué fue puntualmente lo que leíste? Te explico exactamente qué pasa en ese caso."

[PRECIO PRIMERO] "Primero dame el precio" / "¿Cuánto cuesta?":
→ Nunca digas que no lo sabés. Dá el precio directo de la lista. Si no sabe qué producto quiere, preguntá el objetivo primero y luego dá el precio y el link del producto recomendado: "[Producto] para ${country} está a [precio de la lista] — ${priceAnchor}. El link de compra directo es: [link del producto de la lista]. ¿Arrancamos?"

"¿Puedo pagar ahora?" / "¿Se puede pagar en el momento?" / "¿Cómo pago?" / "¿Dónde pago?":
→ "¡Sí, acá mismo! Acá está el link — el producto ya viene seleccionado: [link del producto de la lista]. Solo completás tu info de entrega, elegís cómo pagar y listo. Si algún paso no te queda claro, avisame y te guío."

════════════════════════════════
URGENCIA (usá 1 por conversación, orgánicamente)
════════════════════════════════
Elegí la que mejor encaja con el contexto:
"El link de compra está activo ahora mismo — podés hacer el pedido en 2 minutos desde tu casa"
"El stock de [producto específico] para ${country} está limitado esta quincena"
"El precio especial para primeras compras en ${country} está disponible hasta el viernes"
"Esta semana tuvimos 3 pedidos de ${country} con ese mismo pack — el resultado que contaron es muy bueno"

════════════════════════════════
PRUEBA SOCIAL ESPECÍFICA (con país + tiempo + resultado concreto)
════════════════════════════════
Peso/quema grasa: "Una clienta de ${country} con exactamente ese problema empezó con Thermo T3 + Nocarb-T y en 3 semanas bajó 4kg y desapareció la hinchazón que tenía hace meses."
Energía/fatiga: "Un cliente de ${country} con la misma fatiga notó diferencia real en 10 días con el Vita Xtra T+ — dejó de necesitar el café de la tarde."
Digestión/tránsito: "Con Prunex 1 la mayoría de clientes de ${country} nota mejoría en el tránsito en los primeros 7 días, sin cambiar nada más."
Fatiga + sueño malo: "Un cliente de ${country} que no descansaba bien empezó con Vita Xtra T+ — en 2 semanas tenía más energía de día y dormía mejor de noche."
Músculo/composición: "Clientes de ${country} que entrenaban sin ver resultados empezaron a notar músculo en 3 semanas con Biopro+ Fit."
Constipación crónica: "Una clienta de ${country} con constipación de meses me escribió al tercer día de Prunex 1 — 'nunca pensé que funcionara tan rápido'."

${catalogSection}

════════════════════════════════
CÓMO SE COMPRA Y CÓMO LLEGA (OBLIGATORIO — aclaralo siempre)
════════════════════════════════
Los productos FuXion NO se venden en tiendas físicas. NO hay catálogo impreso. NO se retira en ningún local.
El único canal de compra es a través del link — pedido online, pago online.
El producto llega al domicilio del cliente por cadetería/envío a domicilio.

Cuando el cliente pregunte dónde comprar o dónde retirar:
→ "Los productos no están en tiendas — se piden directamente por este link y te llegan a tu casa por envío. Es la forma más cómoda y directa."

Al enviar el link, siempre incluí esta frase corta:
"El link te lleva directo al producto — completás tu dirección de entrega y elegís cómo pagar. Te llega a tu casa."

Si el cliente pregunta cómo se hace ("¿qué hago con el link?", "¿cómo compro?", "¿es difícil?"):
→ "Abrís el link → tocás Comprar → ponés tu nombre, dirección y elegís cómo pagar → te llega por envío a tu casa. ¿Cuál paso te frena?"
Respondé solo la duda específica, no expliques todo el proceso si no preguntaron.

Si el cliente pregunta cuánto tarda el envío:
→ "El tiempo de entrega depende de tu zona dentro de ${country} — generalmente entre 3 y 7 días hábiles. El link te da la info exacta al confirmar el pedido."

Si el cliente ya compró antes: "Entrás con tu cuenta — el producto ya viene seleccionado, solo confirmás tu dirección y el pago."

════════════════════════════════
PRESENTACIÓN DE LOS PRODUCTOS (CRÍTICO — NUNCA te equivoques en esto)
════════════════════════════════
Los productos FuXion NO vienen en cápsulas. JAMÁS uses la palabra "cápsula" ni "pastilla".
La presentación correcta de TODOS los productos:
Todos vienen en sobres individuales con polvo adentro — se disuelven en agua.
Prunex 1 → sobre con polvo, disolver en agua (fría o caliente)
Vita Xtra T+ → sobre con polvo, disolver en agua
Biopro+ Fit → sobre con polvo proteico, mezclar con agua o leche
Nocarb-T → sobre con polvo, disolver en agua
Thermo T3 → sobre con polvo, disolver en agua
Si el cliente pregunta cómo se toma: "Viene en sobres individuales — disolvés el polvo en agua y listo."

════════════════════════════════
REGLAS DE FORMATO (CRÍTICO)
════════════════════════════════
Texto plano únicamente. NUNCA asteriscos (*), guiones bajos (_) ni markdown.
Máximo 3 párrafos cortos — esto es WhatsApp, no un email.
Productos en líneas separadas con emoji, nunca en párrafo corrido.

════════════════════════════════
PAGOS — SIN CUOTAS EN NINGÚN PAÍS (ABSOLUTO)
════════════════════════════════
FuXion no maneja cuotas ni financiamiento en ningún país. Pago único siempre.
NUNCA menciones cuotas como opción. Si el cliente las pide:
→ Reencuadralo como ventaja: "El pago es en un solo pago — tiene sentido porque empezás a ver resultados antes de que hayas gastado lo mismo en cosas que no te funcionaron."
→ Si el precio es la barrera real, ofrecé un pack de entrada más pequeño (1 producto) en vez de cuotas.
→ Usá el costo de oportunidad: "¿Cuánto llevás gastando en [farmacias / otros suplementos] sin resolver el problema? Con lo que gastás en 2 meses en eso, cubrís el pack entero."

════════════════════════════════
CIERRE BASADO EN DOLOR (TÉCNICA OBLIGATORIA)
════════════════════════════════
Antes de cada cierre final, usá esta secuencia de 3 pasos:
1. RECORDAR EL DOLOR: "Sabés que llevar [X meses/semanas] con [dolor que mencionaron] no es una situación normal ni que se va sola."
2. PROYECTAR LA INACCIÓN: "Si hoy no hacés algo diferente, en 3 meses seguís exactamente igual — con el mismo cansancio, la misma hinchazón, el mismo problema."
3. RESOLVER COMO ALIVIO: "El pack que te recomendé empieza a actuar en [X días/semanas] — no es un parche, va a la raíz."
Después de estos 3 pasos, cerrá siempre con cierre condicional o asumido. Nunca dejés el mensaje abierto.

════════════════════════════════
PROBLEMA DE SALUD DETECTADO — PROTOCOLO ESPECIAL
════════════════════════════════
Cuando el mensaje incluya [PROBLEMA DE SALUD DETECTADO] con los compuestos del producto:
→ NO cerrés la venta. NO transferís a Andrés. NO presionés.
→ Tu único objetivo en este mensaje es dar información y generar confianza.
→ Respondé con:
  1. Validación empática breve: "Gracias por contarme eso, es importante saberlo."
  2. Compuestos del producto (usá los que vienen en el tag, literalmente): "Los ingredientes de [producto] son: [compuestos del tag]."
  3. Recomendación de consulta médica sin alarmar: "Lo ideal es que lo confirmes con tu médico antes de empezar, así arrancás con total tranquilidad."
  4. Puerta abierta sin presión: "En unos días te escribo para ver cómo seguiste. Si ya consultaste y querés arrancar, estoy acá."
→ Tono: cálido, sin presión, profesional. Este cliente necesita confianza, no urgencia.

════════════════════════════════
SEÑALES DE COMPRA (CIERRE INMEDIATO)
════════════════════════════════
Si el cliente pregunta por envío, pago, timing o dice "quiero pedirlo/comprarlo/empezar":
→ Son señales de compra — el cliente ya decidió internamente.
→ NO sigas explicando. Cerrá en ESE mensaje:
${hasDirectBuyLink
  ? `Dá el precio + link directo del producto inmediatamente:
"[Producto] cuesta [precio de la lista] — ${priceAnchor}. Comprá acá: [link del producto de la lista]. ¿Lo pedimos ahora?"
NO uses [TRANSFER_NEEDED] para cierre directo de producto individual en ${country}.`
  : `"Si Andrés te puede confirmar el precio para ${country} hoy, ¿lo arrancamos?"
"¿A qué nombre hago el pedido para ${country}?"
→ Añadí [TRANSFER_NEEDED] inmediatamente.`
}

════════════════════════════════
COMPRA PARA TERCERO
════════════════════════════════
Si el cliente dice "es para mi mamá/hijo/pareja/etc.":
→ Adaptá el enfoque: "¡Qué lindo regalo! ¿Cuál es el problema principal que tiene [ella/él]? Así te recomiendo el pack exacto."
→ Calificá el problema del TERCERO, no del comprador.
→ Usá la misma fórmula de espejo del dolor pero referida al tercero.
→ En el cierre: ${hasDirectBuyLink ? `"El pack para [nombre del tercero] está en [link del producto de la lista]. Te lo compartimos para que lo podás dar como regalo. ¿Qué nombre va en el pedido?"` : `"Andrés puede armar el pack para [nombre del tercero] y te lo explica a vos para que lo puedas dar." → [TRANSFER_NEEDED]`}

════════════════════════════════
CIERRE DIRECTO VS TRANSFERENCIA
════════════════════════════════
${hasDirectBuyLink
  ? `En ${country} NO usés cierre condicional con Andrés. Cerrás directo:
"[Producto] cuesta [precio de la lista] — ${priceAnchor}."
"Comprá acá: [link del producto de la lista]. ¿Lo pedimos?"
"¿A qué nombre va el pedido?"
"¿Cuándo querés que te llegue?"
[TRANSFER_NEEDED] SOLO para: combos/packs, consulta de distribuidor, cliente que pide hablar con una persona.`
  : `Antes de añadir [TRANSFER_NEEDED], usá siempre un cierre condicional que pre-comprometa:
"Si Andrés te puede dar el precio esta semana, ¿lo arrancamos?"
"Si puedo conseguirte el precio especial de inicio, ¿empezamos hoy?"
"Si el precio está dentro de lo que tenés en mente, ¿lo cerramos?"
Cuando dicen "sí" a esto, la transferencia ya es casi un trámite.`
}

════════════════════════════════
POST-OBJECIÓN — SIEMPRE VOLVÉ AL CIERRE
════════════════════════════════
Después de manejar CUALQUIER objeción, nunca dejes la conversación abierta.
Siempre terminá el mensaje de objeción con el retorno al cierre:
${hasDirectBuyLink
  ? `"¿Cuándo querés arrancar — esta semana o la que viene?"
"¿Lo cerramos ahora con el link directo o tenés alguna duda más?"`
  : `"¿Te lo paso a Andrés para que te dé el precio exacto?"
"¿Cerramos esta semana o la que viene?"`
}
Si no volvés al cierre después de la objeción, la conversación se muere.

════════════════════════════════
PERSONALIZACIÓN CON NOMBRE
════════════════════════════════
${clientName ? `El cliente se llama ${clientName}. Usá su nombre:` : "Si el cliente dice su nombre en algún momento, guardalo y usalo. Usá el nombre:"}
- En el saludo del primer mensaje
- En el momento del cierre: "${clientName ? clientName + ", " : ""}este es el link para ${country}: [link del producto]"
- Una vez más si hay transferencia (combos, distribuidor)
No lo uses en cada frase — se vuelve artificial. Solo en momentos clave.

════════════════════════════════
LONGITUD DE MENSAJES (CRÍTICO PARA WHATSAPP)
════════════════════════════════
Máximo 3 párrafos cortos. Máximo 120 palabras por mensaje.
Si tenés más para decir, priorizá lo más importante y descartá el resto.
Un mensaje largo en WhatsApp se ignora. Uno corto se responde.
NUNCA asteriscos (*), guiones bajos (_) ni markdown de ningún tipo.
Emojis: máximo 2-3 por mensaje, solo para reforzar emoción, no de adorno.

${hasDirectBuyLink
  ? `[TRANSFER_NEEDED]: en ${country} SOLO añadís este tag cuando:
- el cliente pide hablar con una persona / pide hablar con Andrés,
- si pregunta si sos IA o bot,
- quiere un combo/pack personalizado con varios productos,
- consulta sobre ser distribuidor o unirse al negocio,
- o si no pudiste resolver una objeción grave después de 2 intentos.
NO uses [TRANSFER_NEEDED] para cierre de producto individual — en ${country} cerrás vos con el link directo.`
  : `[TRANSFER_NEEDED]: añadí este tag exactamente cuando:
el cliente muestra señal de compra, quiere precio o quiere comprar,
después del mensaje 3 de la conversación,
si pregunta si sos real o pide hablar con persona,
o si no pudiste resolver una objeción.`
}`;
}

// ── AI RESPONSE ───────────────────────────────────────────────
async function getAIResponse(phone, userMessage, history, agentName, countryInfo, isWarm = false, clientName = "") {
  const systemPrompt = buildSystemPrompt(phone, agentName, countryInfo, isWarm, clientName);

  const messages = [
    ...history.filter(h => h.role !== "system").map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: userMessage },
  ];

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system: systemPrompt,
    messages,
  });

  return response.content[0].text;
}

// ── TEXT SANITIZER ────────────────────────────────────────────
function sanitizeForWhatsApp(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")   // **negrita** → texto
    .replace(/__(.+?)__/g, "$1")        // __subrayado__ → texto
    .replace(/(?<!\w)\*(?!\s)(.+?)(?<!\s)\*(?!\w)/g, "$1") // *italic* → texto
    .replace(/_(?!\s)(.+?)(?<!\s)_/g, "$1")                // _italic_ → texto
    .trim();
}

// ── WHATSAPP API ──────────────────────────────────────────────
let lastWAError = null; // track most recent send error for /health

async function sendWAMessage(to, text) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.error("❌ sendWAMessage: WHATSAPP_TOKEN or WHATSAPP_PHONE_ID missing");
    return null;
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: text, preview_url: false },
        }),
      }
    );
    const data = await res.json();
    if (data.error) {
      lastWAError = `[${new Date().toISOString()}] to=${to} error=${data.error.message} (code ${data.error.code})`;
      console.error("❌ WA send error:", lastWAError);
    } else {
      // Clear error on success
      if (to === OWNER_PHONE) lastWAError = null;
    }
    return data;
  } catch (err) {
    lastWAError = `[${new Date().toISOString()}] to=${to} fetch_error=${err.message}`;
    console.error("❌ WA fetch error:", lastWAError);
    return null;
  }
}

async function generateSalesBrief(history, country) {
  try {
    const convo = history
      .filter(h => h.role !== "system")
      .slice(-10)
      .map(h => `${h.role === "user" ? "Cliente" : "Bot"}: ${h.content}`)
      .join("\n");

    const r = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: `Sos un coach de ventas analizando una conversación de WhatsApp de FuXion en ${country}.
Respondé SOLO con este formato exacto, sin texto extra, sin asteriscos:

🌡️ Temperatura: [Frío / Tibio / Caliente] — [una razón en 5 palabras]
😟 Su dolor: [dolor principal que mencionó]
💊 Producto recomendado: [producto/s]
💡 Cómo cerrar: [consejo específico y concreto de 1 línea para que Andrés cierre esta venta]
⚠️ Cuidado con: [objeción probable o punto sensible, o "Sin objeciones detectadas"]`,
      messages: [{ role: "user", content: `Conversación:\n${convo}` }],
    });
    return r.content[0].text.trim();
  } catch {
    return null;
  }
}

async function notifyOwner(clientPhone, clientName, summary, extra = {}, history = []) {
  const countryInfo = detectCountry(clientPhone);
  const flagMap = { Uruguay:"🇺🇾", Argentina:"🇦🇷", Colombia:"🇨🇴", México:"🇲🇽",
    España:"🇪🇸", Brasil:"🇧🇷", Chile:"🇨🇱", Perú:"🇵🇪", "Estados Unidos":"🇺🇸" };
  const flag = flagMap[countryInfo.country] || "🌍";

  // Closer briefing — qué hacer Andrés para cerrar
  const objectionAdvice = {
    price:       "habló del precio → anclar valor primero, luego comparar con lo que gasta en farmacias",
    delay:       "dijo que lo piensa → usar urgencia de stock/precio y future pacing",
    doubt:       "dudó si funciona → validar con prueba social de ${countryInfo.country} y preguntar qué probó antes",
    trust:       "preguntó si es legítimo → mostrar certificaciones y años de empresa",
    partner:     "necesita consultarlo con pareja → mandarle resumen para que se lo muestre, urgencia de precio semanal",
    competition: "ya usa algo similar → preguntar qué resultados tiene, diferenciar biotecnología vs suplemento de góndola",
    skepticism:  "leyó cosas negativas → pedir qué leyó puntualmente y desactivarlo con casos reales de su país",
  };

  const lines = [
    `🔔 LEAD CALIENTE — PowerVita`,
    ``,
    `👤 ${clientName || "Sin nombre"} ${flag} ${countryInfo.country}`,
    `📱 Escribile YA: wa.me/${clientPhone}`,
    extra.product   ? `🛒 Producto recomendado: ${extra.product}` : "",
    extra.objective ? `🎯 Objetivo del cliente: ${extra.objective}` : "",
    ``,
    extra.objection
      ? [`⚠️ OBJECIÓN QUE TUVO: "${extra.objection}"`,
         `💡 Cómo cerrarla: ${objectionAdvice[extra.objectionType] || "escuchar y validar antes de responder"}`].join("\n")
      : "",
    ``,
    `📋 RESUMEN DE LA CONVERSACIÓN:`,
    summary,
    ``,
    `── PARA CERRAR ────────────────`,
    `1. Saludalo por su nombre y retomá exactamente el problema que contó`,
    `2. Dale el precio directo sin rodeos`,
    `3. Usá: "¿Lo cerramos ahora o necesitás algo más?"`,
    `4. Si vacila: "¿Qué te frena?" — escuchá y resolvé solo eso`,
    `───────────────────────────────`,
    `⏱️ Escribile en los próximos 30 min — el lead está caliente ahora.`,
  ].filter(l => l !== "");

  return sendWAMessage(OWNER_PHONE, lines.join("\n"));
}

async function copyToOwner(phone, contactName, countryInfo, botMessage) {
  const flagMap = { Uruguay:"🇺🇾", Argentina:"🇦🇷", Colombia:"🇨🇴", México:"🇲🇽",
    España:"🇪🇸", Brasil:"🇧🇷", Chile:"🇨🇱", Perú:"🇵🇪", "Estados Unidos":"🇺🇸" };
  const flag = flagMap[countryInfo.country] || "🌍";
  const preview = botMessage.length > 300 ? botMessage.slice(0, 300) + "..." : botMessage;
  return sendWAMessage(OWNER_PHONE, `💬 ${contactName || phone} ${flag}\n\n${preview}`);
}

// ── DATABASE ──────────────────────────────────────────────────
async function getConversation(phone) {
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();
    return data;
  } catch { return null; }
}

async function getLead(phone) {
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();
    return data;
  } catch { return null; }
}

async function saveConversation(phone, updates) {
  if (!supabase) return;
  try {
    await supabase
      .from("conversations")
      .upsert({ phone, ...updates, updated_at: new Date().toISOString() });
  } catch (e) { console.error("saveConversation error:", e.message); }
}

async function saveLead(phone, updates) {
  if (!supabase) return;
  try {
  await supabase
    .from("leads")
    .upsert({ phone, ...updates, updated_at: new Date().toISOString() });
  } catch (e) { console.error("saveLead error:", e.message); }
}

// ── MAIN MESSAGE HANDLER ──────────────────────────────────────
function extractRef(text) {
  const m = text.match(/\[ref:([^\]]+)\]\s*$/i);
  if (!m) return { clean: text, ref: "" };
  return { clean: text.slice(0, m.index).trim(), ref: m[1] };
}

async function handleMessage(phone, rawText, contactName) {
  try {
    const { clean: text, ref: landingRef } = extractRef(rawText);
    const conv = await getConversation(phone);

    // Rate limit check
    if (isRateLimited(phone)) {
      console.warn(`⚡ Rate limited: ${phone}`);
      return;
    }

    // If already transferred to owner, stay silent
    if (conv?.transferred) return;

    // STOP / opt-out detection (before anything else)
    if (isStopMessage(text)) {
      const lang = detectCountry(phone).lang || "es";
      const reply = STOP_REPLIES[lang] || STOP_REPLIES.es;
      await sendWAMessage(phone, reply);
      await saveConversation(phone, { opted_out: true, history: conv?.history || [] });
      await saveLead(phone, { status: "opted_out" });
      console.log(`🚫 Opt-out: ${phone}`);
      return;
    }

    // If already opted out, stay silent
    if (conv?.opted_out) return;

    const agentName = getAgentName(phone);
    const countryInfo = detectCountry(phone);
    let history = conv?.history || [];
    let retries = conv?.retries || 0;

    // ── NUEVO LEAD — notificar al dueño en el primer mensaje ──
    const isNewLead = !conv || !history.length;
    if (isNewLead) {
      const flagMap = { Uruguay:"🇺🇾", Argentina:"🇦🇷", Colombia:"🇨🇴", México:"🇲🇽",
        España:"🇪🇸", Brasil:"🇧🇷", Chile:"🇨🇱", Perú:"🇵🇪", "Estados Unidos":"🇺🇸" };
      const flag = flagMap[countryInfo.country] || "🌍";
      const fromAd = text.toLowerCase().includes("anuncio") || text.toLowerCase().includes("prunex") || text.toLowerCase().includes("asesor");
      const newLeadMsg =
        `🆕 NUEVO CONTACTO — PowerVita\n\n` +
        `👤 ${contactName || "Sin nombre"} ${flag} ${countryInfo.country}\n` +
        `📱 wa.me/${phone}\n` +
        (fromAd ? `📢 Viene del anuncio\n` : "") +
        (landingRef ? `🔗 Origen landing: ${landingRef}\n` : "") +
        `💬 Dice: "${text}"`;
      sendWAMessage(OWNER_PHONE, newLeadMsg); // sin await — no bloquear la respuesta
      console.log(`🆕 New lead: ${phone} [${countryInfo.country}]${landingRef ? ` ref=${landingRef}` : ""}`);
    }

    // ── PENDING TRANSFER CONFIRMATION ─────────────────────────
    const hasPendingTransfer = history.some(h => h.role === "system" && h.content === "PENDING_TRANSFER");
    if (hasPendingTransfer) {
      const lang = countryInfo.lang || "es";

      if (isNoReply(text)) {
        // Cliente dijo que no — limpiar el pending y seguir conversando
        const cleanedHistory = history.filter(h => !(h.role === "system" && h.content === "PENDING_TRANSFER"));
        const noMsgs = {
          es: "Sin problema 😊 ¿Qué más querés saber sobre los productos?",
          pt: "Sem problema 😊 O que mais você quer saber?",
          en: "No problem 😊 What else would you like to know?",
          fr: "Pas de problème 😊 Que souhaitez-vous savoir d'autre?",
          it: "Nessun problema 😊 Cos'altro vuoi sapere?",
          de: "Kein Problem 😊 Was möchten Sie noch wissen?",
        };
        const noMsg = noMsgs[lang] || noMsgs.es;
        await sendWAMessage(phone, noMsg);
        await saveConversation(phone, { history: [...cleanedHistory, { role: "user", content: text }, { role: "assistant", content: noMsg }].slice(-20), last_message_at: new Date().toISOString() });
        console.log(`↩️ Transfer declined, continuing: ${phone}`);
        return;
      }

      if (isYesReply(text) || hasBuyingSignal(text)) {
        // Confirma explícitamente (o ya pregunta cómo pagar/recibir) — proceder con la transferencia
        const confirmMsgs = {
          es: `¡Perfecto! 🙌 Andrés ya está al tanto y te va a escribir muy pronto con el precio para ${countryInfo.country} 😊🌿`,
          pt: `Ótimo! 🙌 Andrés já foi notificado e vai te escrever em breve com o preço 😊🌿`,
          en: `Perfect! 🙌 Andrés is already aware and will write to you very soon with the price 😊🌿`,
          fr: `Parfait! 🙌 Andrés est déjà informé et va vous écrire très bientôt avec le prix 😊🌿`,
          it: `Perfetto! 🙌 Andrés è già stato avvisato e ti scriverà presto con il prezzo 😊🌿`,
          de: `Perfekt! 🙌 Andrés ist bereits informiert und meldet sich bald mit dem Preis 😊🌿`,
        };
        const confirmMsg = confirmMsgs[lang] || confirmMsgs.es;
        await sendWAMessage(phone, confirmMsg);
        await copyToOwner(phone, contactName, countryInfo, confirmMsg);

        const cleanHistory = history
          .filter(h => !(h.role === "system" && h.content === "PENDING_TRANSFER"))
          .concat([{ role: "user", content: text }, { role: "assistant", content: confirmMsg }])
          .slice(-20);

        await saveConversation(phone, { transferred: true, history: cleanHistory, last_message_at: new Date().toISOString() });
        await saveLead(phone, { name: contactName, country: countryInfo.country, lang: countryInfo.lang, status: "transferred" });

        const summary = cleanHistory.filter(h => h.role !== "system").slice(-8)
          .map(h => `${h.role === "user" ? "Cliente" : agentName}: ${h.content}`).join("\n");
        // Extract product interest from history for owner notification
        const productLine = cleanHistory.find(h => h.role === "assistant" && h.content.match(/Thermo|Biopro|Vita Xtra|No Stress|Prunex|Nocarb|Flora Liv|Youth Elixir|Beauty In|Golden FLX/i));
        const productMatch = productLine?.content.match(/(Thermo T3|Biopro\+\s*\w+|Vita Xtra T\+|No Stress|Prunex 1|Nocarb-T|Flora Liv|Youth Elixir|Beauty In|Golden FLX|Protein Active)/i);
        await notifyOwner(phone, contactName, summary || "Sin historial previo", {
          product: productMatch?.[0] || "",
          country: countryInfo.country,
        }, cleanHistory);
        console.log(`🤝 Transfer confirmed: ${phone}`);
        return;
      }

      // Cliente escribió algo distinto a sí/no (pregunta, comentario) — limpiar PENDING_TRANSFER y continuar con IA
      history = history.filter(h => !(h.role === "system" && h.content === "PENDING_TRANSFER"));
      console.log(`↪️ PENDING_TRANSFER cleared — client sent non-yes/no: ${phone}`);
    }

    // Anti-loop: detect meaningless input
    const isMeaningless = text.trim().length < 2 || /^[^a-zA-ZÀ-ÿ0-9]+$/.test(text.trim());
    if (isMeaningless) retries++;
    else retries = 0;

    // Force transfer after 2 unclear messages
    if (retries >= 2) {
      const forceMsg = `Un momento, te conecto directamente con ${OWNER_NAME} para que te atienda personalmente 😊`;
      await sendWAMessage(phone, forceMsg);
      await copyToOwner(phone, contactName, countryInfo, forceMsg);
      await saveConversation(phone, { transferred: true, history, retries });
      await saveLead(phone, {
        name: contactName,
        country: countryInfo.country,
        lang: countryInfo.lang,
        status: "transferred",
      });
      return;
    }

    // Distributor detection — transfer immediately with context
    if (isDistributorInquiry(text) && history.length < 4) {
      const lang = countryInfo.lang || "es";
      const distMsgs = {
        es: `¡Qué buena decisión! 🌟 FuXion es una de las oportunidades de negocio de mayor crecimiento en ${countryInfo.country}.\nTe conecto ahora con ${OWNER_NAME} para que te cuente todo sobre el plan de negocio, los ingresos y cómo empezar 💼`,
        pt: `Que ótima decisão! 🌟 FuXion é uma das oportunidades de negócio com maior crescimento em ${countryInfo.country}.\nVou te conectar com ${OWNER_NAME} para te contar tudo sobre o plano de negócios 💼`,
        en: `Great choice! 🌟 FuXion is one of the fastest-growing business opportunities in ${countryInfo.country}.\nLet me connect you with ${OWNER_NAME} to tell you all about the business plan and how to get started 💼`,
        fr: `Excellent choix! 🌟 FuXion est l'une des opportunités commerciales à la croissance la plus rapide en ${countryInfo.country}.\nJe vous mets en contact avec ${OWNER_NAME} 💼`,
        it: `Ottima scelta! 🌟 FuXion è una delle opportunità di business in più rapida crescita in ${countryInfo.country}.\nTi metto in contatto con ${OWNER_NAME} 💼`,
        de: `Tolle Entscheidung! 🌟 FuXion ist eine der am schnellsten wachsenden Geschäftsmöglichkeiten in ${countryInfo.country}.\nIch verbinde Sie jetzt mit ${OWNER_NAME} 💼`,
      };
      const msg = distMsgs[lang] || distMsgs.es;
      await sendWAMessage(phone, msg);
      await copyToOwner(phone, contactName, countryInfo, msg);
      await saveConversation(phone, { transferred: true, history, retries });
      await saveLead(phone, {
        name: contactName,
        country: countryInfo.country,
        lang: countryInfo.lang,
        status: "distributor_lead",
        last_objective: "distributor",
      });
      console.log(`💼 Distributor lead transferred: ${phone}`);
      return;
    }

    // Detect warm lead (high purchase intent from landing CTAs)
    const warm = history.length === 0 && isWarmLead(text);

    // Detect all signals for context injection
    const objection     = detectObjection(text);
    const buySignal     = hasBuyingSignal(text);
    const thirdParty    = isThirdPartyPurchase(text);
    const healthConcern = detectHealthConcern(text);

    // For health concerns: find the product discussed and inject its compounds
    let healthTag = "";
    if (healthConcern) {
      const discussed = detectDiscussedProduct([...history, { role: "user", content: text }]);
      const compounds = discussed ? PRODUCT_COMPOUNDS[discussed] : null;
      healthTag = compounds
        ? `[PROBLEMA DE SALUD DETECTADO] [PRODUCTO CONSULTADO: ${discussed}] [COMPUESTOS: ${compounds}]`
        : `[PROBLEMA DE SALUD DETECTADO] [PRODUCTO NO IDENTIFICADO — preguntá cuál está consultando antes de dar compuestos]`;
    }

    const contextTags = [
      healthTag,
      !healthConcern && objection  ? `[OBJECIÓN DETECTADA: ${objection}]` : "",
      !healthConcern && buySignal  ? (COUNTRY_BUY_LINKS[countryInfo.country]
        ? "[SEÑAL DE COMPRA — dar precio + link del producto de la lista AHORA, cierre directo, NO añadás TRANSFER_NEEDED]"
        : "[SEÑAL DE COMPRA — cierre condicional + TRANSFER_NEEDED]") : "",
      !healthConcern && thirdParty ? "[COMPRA PARA TERCERO — preguntar para quién y qué problema tiene esa persona]" : "",
    ].filter(Boolean).join(" ");

    const enrichedText = contextTags ? `${contextTags} ${text}` : text;

    // Get AI response
    let aiResponse;
    try {
      aiResponse = await getAIResponse(phone, enrichedText, history, agentName, countryInfo, warm, contactName);
    } catch (err) {
      console.error("AI error:", err.message);
      aiResponse = `¡Hola! Soy ${agentName} del equipo PowerVita 😊 Tuve un pequeño inconveniente técnico. ${OWNER_NAME} te contactará muy pronto. ¡Disculpa!`;
    }

    // Detect transfer tag
    const needsTransfer = aiResponse.includes("[TRANSFER_NEEDED]");
    const cleanResponse = aiResponse.replace("[TRANSFER_NEEDED]", "").trim();

    // Update history (keep last 20 messages)
    history = [
      ...history,
      { role: "user", content: text },
      { role: "assistant", content: cleanResponse },
      // Mark pending transfer — locked only after user's next reply confirms
      ...(needsTransfer ? [{ role: "system", content: "PENDING_TRANSFER" }] : []),
    ].slice(-20);

    // Save state — bot stays active until user confirms transfer
    await saveConversation(phone, {
      history,
      retries,
      transferred: false,
      last_message_at: new Date().toISOString(),
    });
    const finalMsg = sanitizeForWhatsApp(cleanResponse);
    const hasBuyLinkInResponse = finalMsg.includes("tiendafuxion.com") || finalMsg.includes("powervita.vercel.app/api/go");
    await sendWAMessage(phone, finalMsg);

    // Copy to owner only on key moments (buy link, transfer, buying signal) — avoids notification fatigue
    if (hasBuyLinkInResponse || needsTransfer || buySignal) {
      await copyToOwner(phone, contactName, countryInfo, finalMsg);
    }
    const leadStatus = needsTransfer ? "transfer_pending"
      : healthConcern ? "health_check"
      : hasBuyLinkInResponse ? "link_sent"
      : "active";

    await saveLead(phone, {
      name: contactName,
      country: countryInfo.country,
      lang: countryInfo.lang,
      status: leadStatus,
    });

    if (hasBuyLinkInResponse) {
      const displayName = contactName || phone;
      sendWAMessage(OWNER_PHONE, `🔗 Link de compra enviado a ${displayName} (${countryInfo.country})`).catch(() => {});
    }

    console.log(`✅ Responded to ${phone} [${countryInfo.country}]${needsTransfer ? " → TRANSFER PENDING" : ""}${hasBuyLinkInResponse ? " → BUY LINK SENT" : ""}`);
  } catch (err) {
    console.error(`❌ Error handling message from ${phone}:`, err.message);
  }
}

// ── NUDGE POR "LEÍDO SIN RESPUESTA" ───────────────────────────
// Meta manda un evento de status "read" cuando el lead ve nuestro mensaje.
// Si pasan 25 min y sigue sin responder (status sigue "active"), le mandamos
// un empujón corto antes de esperar a las 8hs del seguimiento normal.
const READ_NUDGE_DELAY_MS = 25 * 60 * 1000;
const pendingReadNudges = new Set();

const READ_NUDGE_MSGS = {
  es: (name, agent, buyLink) => `¡Vi que leíste mi mensaje! 👀${name ? ` ${name}` : ""} ¿Tenés alguna duda, o hacemos el pedido directo ahora? Acá está el link: ${buyLink} — Soy ${agent} 🌿`,
  pt: (name, agent, buyLink) => `Vi que você leu minha mensagem! 👀${name ? ` ${name}` : ""} Ficou alguma dúvida, ou fazemos o pedido agora? O link direto: ${buyLink} — Sou ${agent} 🌿`,
  en: (name, agent, buyLink) => `Saw you read my message! 👀${name ? ` ${name}` : ""} Any questions, or shall we place the order now? Direct link: ${buyLink} — It's ${agent} 🌿`,
  fr: (name, agent, buyLink) => `J'ai vu que vous avez lu mon message! 👀${name ? ` ${name}` : ""} Des questions, ou on passe la commande maintenant? Lien direct: ${buyLink} — C'est ${agent} 🌿`,
  it: (name, agent, buyLink) => `Ho visto che hai letto il mio messaggio! 👀${name ? ` ${name}` : ""} Hai dubbi, o facciamo l'ordine adesso? Link diretto: ${buyLink} — Sono ${agent} 🌿`,
  de: (name, agent, buyLink) => `Ich habe gesehen, dass Sie meine Nachricht gelesen haben! 👀${name ? ` ${name}` : ""} Noch Fragen, oder bestellen wir jetzt? Direktlink: ${buyLink} — Hier ist ${agent} 🌿`,
};

function scheduleReadNudge(phone) {
  if (pendingReadNudges.has(phone)) return; // ya hay un chequeo programado, no duplicar
  pendingReadNudges.add(phone);
  setTimeout(async () => {
    pendingReadNudges.delete(phone);
    try {
      const lead = await getLead(phone);
      if (!lead || lead.status !== "active") return; // ya respondió o cambió de estado

      const conv = await getConversation(phone);
      if (!conv || conv.transferred || conv.purchased || conv.opted_out) return;

      const agentName = getAgentName(phone);
      const lang = lead.lang || "es";
      const msgFn = READ_NUDGE_MSGS[lang] || READ_NUDGE_MSGS.es;
      const buyLink = getBuyLink(lead.country, phone);
      const msg = msgFn(lead.name, agentName, buyLink);

      await sendWAMessage(phone, msg);
      await saveLead(phone, { status: "followup_1" }); // sigue la cadena normal desde stage 1
      console.log(`👀 Read-nudge sent to ${phone}`);
    } catch (err) {
      console.error("Read-nudge error:", err.message);
    }
  }, READ_NUDGE_DELAY_MS);
}

// ── SEGUIMIENTO INTELIGENTE (4 etapas) ────────────────────────
// Etapa 0: 8hs   → red de seguridad si no hubo recibo de lectura
// Etapa 1: 24hs  → recordatorio suave (o antes, via nudge de lectura)
// Etapa 2: 4 días → mensaje de valor + urgencia
// Etapa 3: seguimiento de consulta de salud a las 96hs

const FOLLOWUP_STAGES = [
  {
    stage: 0,
    hoursAfter: 8,
    statusRequired: "active",
    nextStatus: "followup_1",
    msgs: {
      es: (name, agent, owner, country, buyLink) => `Hola${name ? ` ${name}` : ""} 😊 Soy ${agent}, te escribí antes sobre lo que me contaste.\nQuería saber cómo estás — ¿pudiste avanzar con algo? El link para ${country} sigue disponible cuando estés lista: ${buyLink}\n\n¿Qué te frenó? Cualquier duda que tengas, acá estoy.`,
      pt: (name, agent, owner, country, buyLink) => `Olá${name ? ` ${name}` : ""} 😊 Sou ${agent}, te escrevi antes.\nQueria saber como você está — conseguiu avançar? O link para ${country} continua disponível: ${buyLink}\n\nQual foi o que travou? Pode me dizer que estou aqui.`,
      en: (name, agent, owner, country, buyLink) => `Hey${name ? ` ${name}` : ""} 😊 It's ${agent} — I reached out before.\nJust checking in — how are you doing? The link for ${country} is still available when you're ready: ${buyLink}\n\nWhat got in the way? I'm here for any questions.`,
      fr: (name, agent, owner, country, buyLink) => `Bonjour${name ? ` ${name}` : ""} 😊 C'est ${agent}, je vous ai écrit avant.\nJe voulais juste savoir comment vous allez — avez-vous pu avancer? Le lien pour ${country} est toujours disponible: ${buyLink}\n\nQu'est-ce qui vous a arrêté(e)? Je suis là pour toute question.`,
      it: (name, agent, owner, country, buyLink) => `Ciao${name ? ` ${name}` : ""} 😊 Sono ${agent}, ti ho scritto prima.\nVolevo solo sapere come stai — sei riuscito/a ad andare avanti? Il link per ${country} è ancora disponibile: ${buyLink}\n\nCosa ti ha fermato? Sono qui per qualsiasi domanda.`,
      de: (name, agent, owner, country, buyLink) => `Hallo${name ? ` ${name}` : ""} 😊 Hier ist ${agent}, ich hatte Ihnen vorher geschrieben.\nIch wollte nur fragen, wie es Ihnen geht — konnten Sie vorankommen? Der Link für ${country} ist noch verfügbar: ${buyLink}\n\nWas hat Sie aufgehalten? Ich bin für jede Frage da.`,
    },
  },
  {
    stage: 1,
    hoursAfter: 24,
    statusRequired: "followup_1",
    nextStatus: "followup_2",
    msgs: {
      es: (name, agent, owner, country, buyLink) => `${name ? `${name}, ` : ""}soy ${agent} 😊\nHace unos días me contaste lo que estabas pasando — quería saber si algo cambió.\nEso que sentías no se va solo, lo sabés. Cuando estés lista, acá tenés el link directo para ${country}: ${buyLink}\n\n¿Qué necesitás para dar el paso?`,
      pt: (name, agent, owner, country, buyLink) => `${name ? `${name}, ` : ""}sou ${agent} 😊\nHá alguns dias você me contou o que estava passando — queria saber se algo mudou.\nO que você sentia não some sozinho. Quando estiver pronto/a, o link para ${country}: ${buyLink}\n\nO que precisa para dar o próximo passo?`,
      en: (name, agent, owner, country, buyLink) => `${name ? `${name}, ` : ""}it's ${agent} 😊\nA few days ago you told me what you were going through — I wanted to check if anything changed.\nWhat you were feeling doesn't go away on its own. When you're ready, here's the link for ${country}: ${buyLink}\n\nWhat do you need to take the next step?`,
      fr: (name, agent, owner, country, buyLink) => `${name ? `${name}, ` : ""}c'est ${agent} 😊\nIl y a quelques jours vous m'avez parlé de ce que vous viviez — je voulais savoir si quelque chose avait changé.\nCe que vous ressentiez ne disparaît pas tout seul. Quand vous êtes prêt(e), voici le lien pour ${country}: ${buyLink}\n\nDe quoi avez-vous besoin pour passer à l'étape suivante?`,
      it: (name, agent, owner, country, buyLink) => `${name ? `${name}, ` : ""}sono ${agent} 😊\nAlcuni giorni fa mi hai raccontato quello che stavi passando — volevo sapere se qualcosa è cambiato.\nQuello che sentivi non scompare da solo. Quando sei pronto/a, ecco il link per ${country}: ${buyLink}\n\nDi cosa hai bisogno per fare il passo successivo?`,
      de: (name, agent, owner, country, buyLink) => `Hallo${name ? ` ${name}` : ""}, hier ist ${agent} nochmal 😊\nDas Problem, das Sie mir erzählt haben, löst sich nicht von allein — der Link für ${country} ist noch aktiv:\n${buyLink}\n\nWas hat Sie aufgehalten? Fragen zum Prozess oder zum Produkt?`,
    },
  },
  {
    stage: 2,
    hoursAfter: 96,
    statusRequired: "followup_2",
    nextStatus: "cold",
    msgs: {
      es: (name, agent, owner, country, buyLink) => `Hola${name ? ` ${name}` : ""} 😊 Soy ${agent}, último mensaje de mi parte.\nEl problema que me contaste no se va solo. Cada semana sin hacer algo es una semana más con eso.\nSi decidís arrancar, acá podés hacer el pedido directo para ${country} — llega a tu casa: ${buyLink} 🌿`,
      pt: (name, agent, owner, country, buyLink) => `Olá${name ? ` ${name}` : ""} 😊 Sou ${agent}, última mensagem da minha parte.\nO problema que você me contou não some sozinho. Cada semana sem agir é mais uma semana com isso.\nQuando decidir, faça seu pedido direto para ${country} aqui: ${buyLink} 🌿`,
      en: (name, agent, owner, country, buyLink) => `Hey${name ? ` ${name}` : ""} 😊 It's ${agent} — last message from me.\nThe problem you told me about doesn't go away on its own. Every week without action is another week with it.\nWhen you're ready, order directly for ${country} here: ${buyLink} 🌿`,
      fr: (name, agent, owner, country, buyLink) => `Bonjour${name ? ` ${name}` : ""} 😊 C'est ${agent} — dernier message de ma part.\nLe problème dont vous m'avez parlé ne disparaît pas seul. Chaque semaine sans agir est une semaine de plus avec ça.\nQuand vous êtes prêt(e), commandez directement pour ${country} ici: ${buyLink} 🌿`,
      it: (name, agent, owner, country, buyLink) => `Ciao${name ? ` ${name}` : ""} 😊 Sono ${agent} — ultimo messaggio da parte mia.\nIl problema che mi hai raccontato non scompare da solo. Ogni settimana senza fare nulla è un'altra settimana con quello.\nQuando sei pronto/a, ordina direttamente per ${country} qui: ${buyLink} 🌿`,
      de: (name, agent, owner, country, buyLink) => `Hallo${name ? ` ${name}` : ""} 😊 Hier ist ${agent} — letzte Nachricht von mir.\nDas Problem, das Sie mir erzählt haben, verschwindet nicht von alleine. Jede Woche ohne Handeln ist eine weitere Woche damit.\nWenn Sie bereit sind, bestellen Sie direkt für ${country} hier: ${buyLink} 🌿`,
    },
  },
  {
    stage: 3,
    hoursAfter: 96,
    statusRequired: "health_check",
    nextStatus: "health_check_followed",
    msgs: {
      es: (name, agent, owner, country) => `Hola${name ? ` ${name}` : ""} 😊 Soy ${agent}.\nHace unos días hablamos y me contaste sobre tu situación de salud. Quería saber cómo seguiste — ¿tuviste oportunidad de consultarlo con tu médico?\nSi ya tenés más claridad y querés saber qué opciones hay para tu caso, estoy acá para orientarte sin apuro 🌿`,
      pt: (name, agent, owner, country) => `Olá${name ? ` ${name}` : ""} 😊 Sou ${agent}.\nHá alguns dias conversamos e você me contou sobre sua situação de saúde. Queria saber como você está — conseguiu consultar seu médico?\nSe já tem mais clareza e quer saber as opções para o seu caso, estou aqui para te orientar 🌿`,
      en: (name, agent, owner, country) => `Hey${name ? ` ${name}` : ""} 😊 It's ${agent}.\nA few days ago you mentioned your health situation. I wanted to check in — did you get a chance to speak with your doctor?\nIf you have more clarity now and want to know what options might work for you, I'm here to help without any pressure 🌿`,
      fr: (name, agent, owner, country) => `Bonjour${name ? ` ${name}` : ""} 😊 C'est ${agent}.\nIl y a quelques jours vous m'avez parlé de votre situation de santé. Je voulais savoir comment vous allez — avez-vous pu consulter votre médecin?\nSi vous avez plus de clarté maintenant, je suis là pour vous orienter 🌿`,
      it: (name, agent, owner, country) => `Ciao${name ? ` ${name}` : ""} 😊 Sono ${agent}.\nQualche giorno fa mi hai parlato della tua situazione di salute. Volevo sapere come stai — hai avuto modo di parlare con il tuo medico?\nSe hai più chiarezza ora e vuoi sapere le opzioni per il tuo caso, sono qui 🌿`,
      de: (name, agent, owner, country) => `Hallo${name ? ` ${name}` : ""} 😊 Hier ist ${agent}.\nVor ein paar Tagen haben Sie mir von Ihrer Gesundheitssituation erzählt. Ich wollte fragen, wie es Ihnen geht — hatten Sie Gelegenheit, Ihren Arzt zu konsultieren?\nWenn Sie mehr Klarheit haben und wissen möchten, welche Optionen für Ihren Fall passen, bin ich hier 🌿`,
    },
  },
  {
    stage: 4,
    hoursAfter: 4,
    statusRequired: "link_sent",
    nextStatus: "followup_1",
    msgs: {
      es: (name, agent, owner, country, buyLink) => `Hola${name ? ` ${name}` : ""} 😊 Soy ${agent}. Te mandé el link para tu pedido de ${country} — ¿pudiste abrirlo?\nAcá lo tenés de nuevo: ${buyLink}\n\n¿Tuviste algún problema con el formulario? Si necesitás que te guíe paso a paso, avisame y lo hacemos juntos.`,
      pt: (name, agent, owner, country, buyLink) => `Olá${name ? ` ${name}` : ""} 😊 Sou ${agent}. Te mandei o link do pedido para ${country} — conseguiste abrir?\nAqui está de novo: ${buyLink}\n\nTeve algum problema no formulário? Se precisar de ajuda, é só falar.`,
      en: (name, agent, owner, country, buyLink) => `Hey${name ? ` ${name}` : ""} 😊 It's ${agent}. I sent you the order link for ${country} — were you able to open it?\nHere it is again: ${buyLink}\n\nDid anything go wrong with the form? Just let me know and I'll walk you through it.`,
      fr: (name, agent, owner, country, buyLink) => `Bonjour${name ? ` ${name}` : ""} 😊 C'est ${agent}. Je vous ai envoyé le lien de commande pour ${country} — avez-vous pu l'ouvrir?\nLe voici à nouveau: ${buyLink}\n\nAvez-vous eu un problème avec le formulaire? Je suis là pour vous guider.`,
      it: (name, agent, owner, country, buyLink) => `Ciao${name ? ` ${name}` : ""} 😊 Sono ${agent}. Ti ho mandato il link dell'ordine per ${country} — sei riuscito/a ad aprirlo?\nEccolo di nuovo: ${buyLink}\n\nHai avuto problemi con il modulo? Sono qui per guidarti passo dopo passo.`,
      de: (name, agent, owner, country, buyLink) => `Hallo${name ? ` ${name}` : ""} 😊 Hier ist ${agent}. Ich habe Ihnen den Bestelllink für ${country} geschickt — konnten Sie ihn öffnen?\nHier nochmal: ${buyLink}\n\nHatten Sie Probleme mit dem Formular? Ich helfe Ihnen Schritt für Schritt.`,
    },
  },
];

async function reactivateTodayLeads() {
  if (!supabase) { sendWAMessage(OWNER_PHONE, "⚠️ REACTIVAR sin efecto — Supabase no disponible").catch(() => {}); return; }
  try {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const { data: leads, error } = await supabase
      .from("leads")
      .select("*")
      .gte("updated_at", todayMidnight.toISOString())
      .not("status", "in", '("sold","opted_out","cold","transferred")');

    if (error) {
      sendWAMessage(OWNER_PHONE, `❌ Error al buscar leads de hoy: ${error.message}`).catch(() => {});
      return;
    }
    if (!leads?.length) {
      sendWAMessage(OWNER_PHONE, `ℹ️ No hay leads activos de hoy para reactivar.`).catch(() => {});
      return;
    }

    let sent = 0;
    for (const lead of leads) {
      const conv = await getConversation(lead.phone);
      if (!conv || conv.transferred || conv.purchased || conv.opted_out) continue;

      const agentName = getAgentName(lead.phone);
      const lang = lead.lang || "es";
      const buyLink = getBuyLink(lead.country, lead.phone);
      const country = lead.country || "tu país";
      const name = lead.name || "";

      const msgs = {
        es: `Hola${name ? ` ${name}` : ""} 😊 Soy ${agentName} de PowerVita.\nQuería saber si tuviste algún problema para completar el pedido — estoy acá para ayudarte.\nAcá está el link directo para ${country}: ${buyLink}\n\nSolo tenés que: 1. Tocar Comprar. 2. Completar tus datos. 3. Elegir el método de pago. ¡Listo, confirmación por correo! ¿Tenés alguna duda?`,
        pt: `Olá${name ? ` ${name}` : ""} 😊 Sou ${agentName} da PowerVita.\nQueria saber se teve algum problema para completar o pedido — estou aqui para ajudar.\nLink direto para ${country}: ${buyLink}\n\nSó precisa: 1. Tocar Comprar. 2. Preencher dados. 3. Escolher pagamento. Confirmação por e-mail! Alguma dúvida?`,
        en: `Hey${name ? ` ${name}` : ""} 😊 It's ${agentName} from PowerVita.\nI wanted to check if you had any trouble completing your order — I'm here to help.\nDirect link for ${country}: ${buyLink}\n\nJust: 1. Tap Buy. 2. Fill in your details. 3. Choose payment. Confirmation by email! Any questions?`,
      };
      const msg = msgs[lang] || msgs.es;

      await sendWAMessage(lead.phone, msg);
      await saveLead(lead.phone, { status: "link_sent" });
      sent++;
      console.log(`🔄 Reactivated: ${lead.phone} [${country}]`);
    }

    sendWAMessage(OWNER_PHONE, `✅ REACTIVAR completado: ${sent} lead${sent !== 1 ? "s" : ""} contactado${sent !== 1 ? "s" : ""} con link de compra directo.`).catch(() => {});
  } catch (err) {
    console.error("Reactivate error:", err.message);
    sendWAMessage(OWNER_PHONE, `❌ Error en REACTIVAR: ${err.message}`).catch(() => {});
  }
}

async function runFollowUps() {
  if (!supabase) return;
  try {
    for (const stage of FOLLOWUP_STAGES) {
      const cutoff = new Date(Date.now() - stage.hoursAfter * 60 * 60 * 1000).toISOString();
      const { data: leads, error } = await supabase
        .from("leads")
        .select("*")
        .eq("status", stage.statusRequired)
        .lt("updated_at", cutoff);

      if (error) { console.error(`Follow-up stage ${stage.stage} error:`, error.message); continue; }
      if (!leads?.length) continue;

      for (const lead of leads) {
        const conv = await getConversation(lead.phone);
        if (!conv || conv.transferred || conv.purchased || conv.opted_out) continue;

        const agentName = getAgentName(lead.phone);
        const lang = lead.lang || "es";
        const msgFn = stage.msgs[lang] || stage.msgs.es;
        const buyLink = getBuyLink(lead.country, lead.phone);
        const msg = msgFn(lead.name, agentName, OWNER_NAME, lead.country || "tu país", buyLink);

        await sendWAMessage(lead.phone, msg);
        await saveLead(lead.phone, { status: stage.nextStatus });
        console.log(`📩 Follow-up stage ${stage.stage + 1} sent to ${lead.phone}`);
      }
    }
  } catch (err) {
    console.error("Follow-up error:", err.message);
  }
}

// ── WEBHOOK ROUTES ────────────────────────────────────────────
// Meta verification
app.get("/webhook", (req, res) => {
  if (
    req.query["hub.mode"] === "subscribe" &&
    req.query["hub.verify_token"] === VERIFY_TOKEN
  ) {
    console.log("✅ Webhook verified by Meta");
    return res.status(200).send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});

// Incoming messages
app.post("/webhook", async (req, res) => {
  // Verify the request is genuinely from Meta
  if (!verifyMetaSignature(req)) {
    console.warn("⚠️ Invalid webhook signature — request rejected");
    return res.sendStatus(403);
  }

  res.sendStatus(200); // Respond to Meta immediately

  try {
    const { object, entry } = req.body;
    if (object !== "whatsapp_business_account") return;

    for (const e of entry || []) {
      for (const change of e.changes || []) {
        const { messages, contacts, statuses } = change.value || {};

        for (const st of statuses || []) {
          if (st.status === "read" && st.recipient_id && st.recipient_id !== OWNER_PHONE) {
            scheduleReadNudge(st.recipient_id);
          }
        }

        if (!messages?.length) continue;

        for (const msg of messages) {
          if (isDuplicate(msg.id)) {
            console.log(`⏭️ Duplicate message ignored: ${msg.id}`);
            continue;
          }
          const phone = msg.from;
          const name = contacts?.[0]?.profile?.name || "";

          if (msg.type === "audio" || msg.type === "voice") {
            const countryInfo = detectCountry(phone);
            const audioReplies = {
              es: "¡Hola! 😊 No pude escuchar el audio. ¿Me escribís tu consulta? Así te ayudo enseguida 📝",
              pt: "Olá! 😊 Não consegui ouvir o áudio. Você poderia me escrever? Assim te ajudo na hora 📝",
              en: "Hey! 😊 I couldn't hear the audio. Could you write your question? I'll help you right away 📝",
              fr: "Bonjour! 😊 Je n'ai pas pu entendre l'audio. Pourriez-vous écrire? Je vous aide tout de suite 📝",
              it: "Ciao! 😊 Non sono riuscito a sentire l'audio. Potresti scrivere? Ti aiuto subito 📝",
              de: "Hallo! 😊 Ich konnte das Audio nicht hören. Könnten Sie schreiben? Ich helfe Ihnen sofort 📝",
            };
            const reply = audioReplies[countryInfo.lang] || audioReplies.es;
            sendWAMessage(phone, reply);
            continue;
          }

          // Imágenes: acusar recibo y pedir contexto
          if (msg.type === "image") {
            const countryInfo = detectCountry(phone);
            const imgReplies = {
              es: "Recibí tu imagen 😊 Para ayudarte mejor, ¿me contás qué producto o tema te interesa?",
              pt: "Recebi sua imagem 😊 Para te ajudar melhor, pode me dizer o que você quer saber?",
              en: "Got your image 😊 To help you better, could you tell me what product or topic you're interested in?",
              fr: "J'ai reçu votre image 😊 Pour mieux vous aider, pourriez-vous me dire ce qui vous intéresse?",
              it: "Ho ricevuto la tua immagine 😊 Per aiutarti meglio, puoi dirmi cosa ti interessa?",
              de: "Ich habe Ihr Bild erhalten 😊 Um Ihnen besser zu helfen, könnten Sie mir sagen, was Sie interessiert?",
            };
            const reply = imgReplies[countryInfo.lang] || imgReplies.es;
            sendWAMessage(phone, reply);
            continue;
          }

          // Stickers y reacciones: ignorar silenciosamente
          if (msg.type === "sticker" || msg.type === "reaction") continue;

          if (msg.type !== "text") continue;
          const text = msg.text.body;
          console.log(`📨 [${phone}] ${name}: ${text}`);

          // ── Owner commands ────────────────────────────────────
          if (phone === OWNER_PHONE) {
            if (/^VENDIDO\s+\d+/i.test(text.trim())) {
              const targetPhone = text.trim().split(/\s+/)[1];
              await Promise.all([
                saveConversation(targetPhone, { purchased: true }),
                saveLead(targetPhone, { status: "sold" }),
              ]);
              sendWAMessage(OWNER_PHONE, `✅ Venta registrada para ${targetPhone}. Ya no recibirá seguimientos automáticos.`);
              console.log(`💰 Sale marked for ${targetPhone}`);
            } else if (/^REACTIVAR$/i.test(text.trim())) {
              reactivateTodayLeads();
            } else if (/^APRENDER$/i.test(text.trim())) {
              // Force insight refresh and show current learnings to owner
              sendWAMessage(OWNER_PHONE, "🧠 Actualizando aprendizajes... (puede tardar 30 segundos)").catch(() => {});
              refreshInsights();
            } else if (/^INSIGHTS?$/i.test(text.trim())) {
              const msg = learnedInsights
                ? `🧠 Aprendizajes actuales (${insightsUpdatedAt ? insightsUpdatedAt.toLocaleString("es-UY") : "sin fecha"}):\n\n${learnedInsights.slice(0, 1200)}`
                : "🧠 Sin aprendizajes cargados todavía. Mandá APRENDER para analizar ahora.";
              sendWAMessage(OWNER_PHONE, msg).catch(() => {});
            } else if (/^PING$/i.test(text.trim())) {
              const now = new Date().toLocaleString("es-UY", { timeZone: "America/Montevideo" });
              const errMsg = lastWAError ? `\n⚠️ Último error WA: ${lastWAError}` : "";
              const insightMsg = insightsUpdatedAt
                ? `\n🧠 Insights: ${insightsUpdatedAt.toLocaleString("es-UY")}`
                : "\n🧠 Sin insights cargados";
              sendWAMessage(OWNER_PHONE,
                `🏓 PONG — Bot activo\n📅 ${now}\n📱 Owner: ${OWNER_PHONE}\n🌐 Phone ID: ${WHATSAPP_PHONE_ID || "❌ MISSING"}\n🔑 Token: ${WHATSAPP_TOKEN ? "✅ set" : "❌ MISSING"}${errMsg}${insightMsg}\n\n💡 Mandá PING una vez por día para mantener las notificaciones activas (ventana 24h de WhatsApp).`
              ).catch(() => {});
            }
            // Ignorar todos los mensajes del dueño — no procesar como cliente
            continue;
          }

          handleMessage(phone, text, name); // async, no await
        }
      }
    }
  } catch (err) {
    console.error("Webhook parse error:", err.message);
  }
});

// Health check — shows env var status, last WA error, insights state
app.get("/health", (_req, res) => res.json({
  status: "ok",
  ts: new Date().toISOString(),
  bot: "PowerVita FuXion Bot",
  env: {
    WHATSAPP_TOKEN:    WHATSAPP_TOKEN    ? "✅ set" : "❌ MISSING",
    WHATSAPP_PHONE_ID: WHATSAPP_PHONE_ID ? "✅ set" : "❌ MISSING",
    VERIFY_TOKEN:      VERIFY_TOKEN      ? "✅ set" : "❌ MISSING",
    ANTHROPIC_API_KEY: ANTHROPIC_API_KEY ? "✅ set" : "❌ MISSING",
    SUPABASE_URL:      SUPABASE_URL      ? "✅ set" : "❌ MISSING",
    SUPABASE_KEY:      SUPABASE_KEY      ? "✅ set" : "❌ MISSING",
    OWNER_PHONE:       OWNER_PHONE || "❌ MISSING",
    WEBHOOK_APP_SECRET: WEBHOOK_APP_SECRET ? "✅ set" : "⚠️ not set (signature check skipped)",
  },
  supabase: supabase ? "✅ connected" : "❌ not connected",
  lastWAError: lastWAError || "none",
  insights: insightsUpdatedAt
    ? `last updated ${insightsUpdatedAt.toISOString()}`
    : "not loaded yet",
}));

// Test endpoint — sends a WhatsApp message to OWNER_PHONE to verify token
app.get("/test-wa", async (_req, res) => {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    return res.json({ ok: false, error: "WHATSAPP_TOKEN or WHATSAPP_PHONE_ID missing" });
  }
  try {
    const result = await fetch(
      `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: OWNER_PHONE,
          type: "text",
          text: { body: "🔧 Test de conexión PowerVita Bot — si recibís este mensaje, el token de WhatsApp funciona correctamente." },
        }),
      }
    );
    const data = await result.json();
    if (data.error) {
      res.json({ ok: false, waError: data.error });
    } else {
      res.json({ ok: true, message: "Mensaje enviado a " + OWNER_PHONE, waResponse: data });
    }
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// ── SERVER START ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 PowerVita Bot running on port ${PORT}`);
  console.log(`📱 Owner notifications → ${OWNER_PHONE}`);
  console.log(`🌍 Webhook: POST /webhook`);
  console.log(`💚 Health:  GET  /health`);

  // Startup self-test: send a ping to OWNER_PHONE 10s after boot
  setTimeout(async () => {
    const result = await sendWAMessage(
      OWNER_PHONE,
      `✅ PowerVita Bot reiniciado y operativo. ${new Date().toLocaleString("es-UY", { timeZone: "America/Montevideo" })} 🌿\n\n💡 Mandá PING al bot una vez por día para mantener las notificaciones activas.`
    );
    if (result?.error) {
      console.error("⚠️ Startup ping to owner failed:", result.error.message,
        "— 24h window may be closed. Send any message to the bot to reopen it.");
    } else {
      console.log("✅ Startup ping sent to owner:", OWNER_PHONE);
    }
  }, 10_000);
});

// Run follow-ups every hour
setInterval(runFollowUps, 60 * 60 * 1000);
setTimeout(runFollowUps, 30_000); // First run 30s after start
