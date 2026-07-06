// ============================================================
// POWERVITA FUXION BOT — Sistema Completo
// Stack: Node.js + Express + Anthropic Claude + Supabase
// WhatsApp: Meta Business API
// Países: Sudamérica, Centroamérica, Norteamérica, Europa
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
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

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
  doubt:       ["no sé si funciona", "no se si funciona", "no funciona", "ya probé", "ya probe", "no me funcionó", "doesn't work", "não funciona", "no veo resultados", "no sirve"],
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

function getBuyLink(country, phone = "") {
  const code = COUNTRY_BUY_LINKS[country];
  if (!code) return FUXION_BUY_LINK;
  const base = "https://powervita.vercel.app/api/go";
  return `${base}?c=${code}${phone ? `&p=${phone}` : ""}`;
}

// ── PRODUCT PRICES ────────────────────────────────────────────
const PRODUCT_PRICES = {
  "Prunex 1": {
    "Uruguay":   { amount: "1.710",  currency: "pesos uruguayos",   symbol: "$U", link: "https://tiendafuxion.com/storelt/Andresvarela/3073072" },
    "Argentina": { amount: "45.550", currency: "pesos argentinos",  symbol: "$",  link: "https://tiendafuxion.com/storelt/Andresvarela/3085903" },
    "Colombia":  { amount: "38.700", currency: "pesos colombianos", symbol: "$",  link: "https://tiendafuxion.com/storelt/Andresvarela/3086029" },
  },
  "Vita Xtra T+": {
    "Uruguay":   { amount: "1.710",   currency: "pesos uruguayos",   symbol: "$U", link: "https://tiendafuxion.com/storelt/Andresvarela/3062050" },
    "Argentina": { amount: "45.550",  currency: "pesos argentinos",  symbol: "$",  link: "https://tiendafuxion.com/storelt/Andresvarela/3085893" },
    "Colombia":  { amount: "38.700",  currency: "pesos colombianos", symbol: "$",  link: "https://tiendafuxion.com/storelt/Andresvarela/3086025" },
  },
  "Biopro+ Fit": {
    "Uruguay":   { amount: "1.425",   currency: "pesos uruguayos",   symbol: "$U", link: "https://tiendafuxion.com/storelt/Andresvarela/3073816" },
    "Argentina": { amount: "37.950",  currency: "pesos argentinos",  symbol: "$",  link: "https://tiendafuxion.com/storelt/Andresvarela/3085938" },
    "Colombia":  { amount: "115.900", currency: "pesos colombianos", symbol: "$",  link: "https://tiendafuxion.com/storelt/Andresvarela/3086030" },
  },
  "Nocarb-T": {
    "Uruguay":   { amount: "1.710",   currency: "pesos uruguayos",   symbol: "$U", link: "https://tiendafuxion.com/storelt/Andresvarela/3073820" },
    "Argentina": { amount: "45.550",  currency: "pesos argentinos",  symbol: "$",  link: "https://tiendafuxion.com/storelt/Andresvarela/3085893" },
    "Colombia":  { amount: "38.700",  currency: "pesos colombianos", symbol: "$",  link: "https://tiendafuxion.com/storelt/Andresvarela/3086028" },
  },
  "Thermo T3": {
    "Uruguay":   { amount: "1.710",   currency: "pesos uruguayos",   symbol: "$U", link: "https://tiendafuxion.com/storelt/Andresvarela/3073822" },
    "Argentina": { amount: "45.550",  currency: "pesos argentinos",  symbol: "$",  link: "https://tiendafuxion.com/storelt/Andresvarela/3085898" },
    "Colombia":  { amount: "38.700",  currency: "pesos colombianos", symbol: "$",  link: "https://tiendafuxion.com/storelt/Andresvarela/3086074" },
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
      const productLink = p.link || buyLink;
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
  const unavailable = getUnavailableProducts(country);
  const available = getAvailableProducts(country);
  const availabilityText =
    `PRODUCTOS DISPONIBLES EN ${country.toUpperCase()} (SOLO podés recomendar estos):\n` +
    available.join(", ") +
    (unavailable.length ? `\n\nNO DISPONIBLES EN ${country.toUpperCase()} — NUNCA los menciones ni sugieras: ${unavailable.join(", ")}` : "");

  return `Sos ${agentName}, closer senior de ventas y bienestar del equipo PowerVita FuXion. Cerraste más de 500 ventas este año. Sos experta en ventas consultivas, sabés leer objeciones antes de que aparezcan y cerrás sin presionar — cerrás generando certeza.
Si alguien te pregunta si sos IA o bot, respondé calurosamente que sos parte del equipo humano y añadí [TRANSFER_NEEDED].

IDIOMA: ${langInstruction}
PAÍS: ${country}
NOMBRE DEL CLIENTE: ${clientName || "desconocido — usá 'vos' o 'tú' según el país"}
HORARIO: ${inHours ? "Horario activo — podés ofrecer conexión inmediata con Andrés" : `Fuera de horario — Andrés atiende de 9am a 10pm hora Uruguay, pero tomá el pedido ahora para que él lo atienda primero`}
LEAD CALIENTE: ${isWarm ? "SÍ — el cliente ya vio los productos y quiere comprar. Saltá el diagnóstico largo. Confirmá el producto, 2 beneficios clave, y pasá directo al precio con Andrés en este mensaje." : "NO — lead nuevo, hacer diagnóstico."}

${availabilityText}

${priceSection}

════════════════════════════════
MISIÓN: CERRAR, NO INFORMAR
════════════════════════════════

FLUJO PAS + SPIN (3 MENSAJES MÁXIMO HASTA EL CIERRE):

MENSAJE 1 — DOLOR REAL:
Saludo breve + credibilidad en 1 línea.
Preguntá el problema Y su dimensión emocional en UNA sola pregunta compuesta:
No: "¿Cuál es tu objetivo?" → genérico, no genera vínculo
Sí: "¿Hace cuánto tiempo tenés ese problema? ¿Y qué es lo que más te cansa o te molesta de eso en el día a día?"
El objetivo: que el cliente ponga en palabras lo que le duele, no solo que lo mencione.
Cerrá con: "🔒 Lo que me contás es confidencial, solo lo uso para recomendarte bien."

MENSAJE 2 — AMPLIFICAR + SOLUCIÓN COMO ALIVIO:
Paso 1 — ESPEJO EXACTO: antes de cualquier producto, repetí casi textualmente lo que dijeron.
Fórmula: "Entiendo perfectamente. [Tiempo] con [problema exacto que usaron] es agotador — especialmente cuando [consecuencia obvia o que mencionaron]."
Paso 2 — COSTO DE NO ACTUAR (1 pregunta, elegí según contexto):
"¿Hay algo que ya no podés hacer como antes por esto?"
"¿Cómo afecta eso tu [trabajo / energía / autoestima / ropa / vida social]?"
"Si en 6 meses seguís igual, ¿qué pasa?"
Paso 3 — FUTURE PACING antes de presentar el producto:
"Imaginate en [X semanas] sin esa [hinchazón/fatiga/digestión pesada]. ¿Qué es lo primero que harías diferente?"
Paso 4 — GIRO: "Justamente para eso existe [pack]. En [X semanas] vas a [resultado opuesto al dolor]."
ORDEN OBLIGATORIO: espejo → costo → future pacing → solución. Nunca al revés.
Cerrá con 1 línea de prueba social hiper-específica (con país, tiempo y resultado concreto).

MENSAJE 3 — CIERRE DIRECTO (NUNCA preguntes "¿te interesa?" ni "¿qué te parece?"):
${hasDirectBuyLink
  ? `En ${country} CERRÁS VOS — sin pasar a Andrés:
Usá lenguaje presupuesto y cerrá con el precio + link directo del producto:
✅ "Con todo lo que me contás, este es el paso. [Producto] cuesta [precio de la lista] — ${priceAnchor}."
✅ "Comprá acá, es 100% seguro y llega a tu domicilio: [link del producto de la lista]. ¿Lo pedimos?"
✅ "¿A qué nombre va el pedido para ${country}?"
✅ "¿Cuándo querés que te llegue — lo antes posible o esperás unos días?"
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
Hinchazón: "Entiendo. Meses con esa hinchazón es agotador — no podés ponerte la ropa que querés, te sentís incómoda sin saber bien de dónde viene. Thermo T3 + Nocarb-T existen exactamente para eso: en 3-4 semanas esa sensación empieza a desaparecer."
Fatiga: "Levantarse todos los días sin energía y tener que funcionar igual es durísimo. ¿Hay cosas que dejaste de hacer porque te agotás? El Vita Xtra T+ ataca exactamente eso — en 10 días la mayoría nota diferencia real."
Sin dormir: "Vivir sin dormir bien lo afecta todo — el humor, el trabajo, las relaciones. ¿Hace cuánto que estás así? El No Stress corta ese ciclo ansioso que no te deja descansar."
Peso estancado: "Hacer el esfuerzo y no ver resultados es frustrante y desmotiva mucho. ¿Cuánto tiempo llevas intentándolo? Thermo T3 + Nocarb-T trabajan en la raíz metabólica, no en el síntoma."
Digestión: "Andar con ese malestar digestivo todo el día te roba energía y concentración para todo. ¿Cuándo fue la última vez que te sentiste bien después de comer? Prunex 1 + Flora Liv regulan el tránsito desde la primera semana."

════════════════════════════════
MANEJO DE OBJECIONES (OBLIGATORIO — nunca ignorar)
════════════════════════════════

[PRECIO] "Es caro" / "No tengo presupuesto" / "Muy caro":
→ "Entiendo. Rápida pregunta: ¿cuánto gastás al mes en lo que usás ahora para ese problema — farmacias, otros suplementos, consultas? [Producto] cuesta [precio de la lista] — ${priceAnchor}. Va directo a la raíz, no al síntoma: [link del producto de la lista]. ¿Lo vemos?"

[DEMORA] "Lo pienso" / "Déjame ver" / "Después" / "Más adelante":
→ Técnica de future pacing + urgencia: "Claro, lo entiendo. Mirá, mientras lo pensás, el problema sigue ahí. ${hasDirectBuyLink ? `El link está disponible ahora mismo y podés hacer el pedido en 2 minutos desde tu casa: [link del producto de la lista]. ¿Lo cerramos antes de que sigas el día?` : `Andrés está cerrando pedidos de ${country} esta semana con precio especial de inicio — no te apuro, pero si lo vas a hacer, conviene antes de que cierre. ¿Le digo que te reserve el precio ahora y lo charlás con calma?`}"

[DUDA] "No sé si funciona" / "Ya probé de todo":
→ "Eso me lo dicen muchas personas de ${country} antes de empezar. La diferencia real es que FuXion usa biotecnología con certificación GMP — el mismo estándar que los medicamentos, no un suplemento de góndola. ¿Qué probaste antes? Así te explico exactamente qué hace diferente el [producto] en tu caso específico."

[CONFIANZA] "¿Es seguro?" / "¿Es legítimo?" / "Es una estafa" / "Es pirámide":
→ "FuXion lleva más de 20 años, presente en 37 países, con certificación GMP internacional y regulado en cada país donde opera. No es un negocio de pirámide — es una empresa de biotecnología con productos registrados. ¿Qué querés saber puntualmente — ingredientes, registros sanitarios, o cómo funciona el modelo?"

[PAREJA] "Tengo que consultarlo con mi pareja/esposo/marido/familia":
→ "Qué bien que lo incluís 😊 Para que puedas mostrarle a [tu pareja] exactamente qué hace el pack y cuánto cuesta, te comparto el link directo ahora: [link del producto de la lista] — [precio de la lista]. Así tienen todo en un mensaje y deciden juntos. El precio especial para primeras compras está disponible esta semana."

[COMPETENCIA] "Ya tengo algo parecido" / "Vi algo más barato" / "Ya uso algo similar":
→ "¿Qué usás ahora? Te pregunto porque FuXion no compite con lo que hay en góndola — es biotecnología certificada GMP, muy distinto a un suplemento de farmacia o supermercado. Si ya usás algo y no ves el resultado que querés, probablemente el [producto recomendado] cubre exactamente lo que te está faltando. ¿Qué resultados tenés hasta ahora con lo que tomás?"

[ESCEPTICISMO] "Vi comentarios malos" / "Me dijeron que no funciona" / "Leí cosas negativas":
→ "Entiendo, eso lo consultan bastante. Los comentarios negativos casi siempre vienen de personas que usaron 1 solo producto sin orientación, o que esperaban resultados en 3 días. El resultado real viene del pack correcto para el problema correcto, tomado bien. ¿Qué fue puntualmente lo que leíste? Así te explico qué pasa en ese caso y por qué nuestra gente de ${country} tiene resultados distintos."

[PRECIO PRIMERO] "Primero dame el precio" / "¿Cuánto cuesta?":
→ Nunca digas que no lo sabés. Dá el precio directo de la lista. Si no sabe qué producto quiere, preguntá el objetivo primero y luego dá el precio y el link del producto recomendado: "[Producto] para ${country} está a [precio de la lista] — ${priceAnchor}. El link de compra directo es: [link del producto de la lista]. ¿Arrancamos?"

"¿Puedo pagar ahora?" / "¿Se puede pagar en el momento?" / "¿Cómo pago?" / "¿Dónde pago?":
→ Nunca lo presentes como una limitación. Respondé con entusiasmo: "¡Sí, claro! El proceso es muy simple y 100% seguro: te comparto el link de la tienda oficial de FuXion para ${country}, entrás, elegís tu producto y completás el pedido en 2 minutos — con tarjeta o los medios de pago disponibles en tu país. Te llega directamente a tu domicilio sin complicaciones. ¿Te mando el link ahora? 👉 ${buyLink}"

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
Peso/hinchazón: "Una clienta de ${country} con exactamente ese problema empezó con este pack y en 3 semanas bajó 4kg y desapareció la hinchazón que tenía hace meses."
Energía/fatiga: "Un cliente de ${country} con la misma fatiga notó diferencia real en 10 días con el Vita Xtra T+ — dejó de necesitar el café de la tarde."
Digestión: "Con Prunex 1 la mayoría de clientes de ${country} nota mejoría en el tránsito en los primeros 7 días, sin cambiar nada más."
Estrés/sueño: "Clientas de ${country} que no podían dormir empezaron a descansar en la primera semana con No Stress — sin somnolencia al día siguiente."
Músculo: "Clientes de ${country} que entrenaban sin ver resultados empezaron a notar músculo en 3 semanas con Biopro+ Sport."

════════════════════════════════
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
🌿 DETOX: Flora Liv + Liquid Fibra + Prunex 1 | Completo: + Berry Balance + Rexet

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
async function sendWAMessage(to, text) {
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
  if (data.error) console.error("WA send error:", data.error.message);
  return data;
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
  const { data } = await supabase
    .from("conversations")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();
  return data;
}

async function getLead(phone) {
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();
  return data;
}

async function saveConversation(phone, updates) {
  await supabase
    .from("conversations")
    .upsert({ phone, ...updates, updated_at: new Date().toISOString() });
}

async function saveLead(phone, updates) {
  await supabase
    .from("leads")
    .upsert({ phone, ...updates, updated_at: new Date().toISOString() });
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
      !healthConcern && buySignal  ? "[SEÑAL DE COMPRA — activar cierre condicional inmediato y añadir TRANSFER_NEEDED]" : "",
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
    await saveLead(phone, {
      name: contactName,
      country: countryInfo.country,
      lang: countryInfo.lang,
      status: needsTransfer ? "transfer_pending" : healthConcern ? "health_check" : "active",
    });

    // Send response
    const finalMsg = sanitizeForWhatsApp(cleanResponse);
    await sendWAMessage(phone, finalMsg);
    await copyToOwner(phone, contactName, countryInfo, finalMsg);

    // Notify owner when bot sends a direct buy link
    const hasBuyLinkInResponse = finalMsg.includes("tiendafuxion.com");
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
  es: (name, agent) => `¡Vi que leíste mi mensaje! 👀${name ? ` ${name}` : ""} ¿Te quedó alguna duda o querés que te pase el precio directo? Soy ${agent}, estoy para ayudarte 🌿`,
  pt: (name, agent) => `Vi que você leu minha mensagem! 👀${name ? ` ${name}` : ""} Ficou alguma dúvida ou quer que eu te passe o preço direto? Sou ${agent} 🌿`,
  en: (name, agent) => `Saw you read my message! 👀${name ? ` ${name}` : ""} Any questions, or want me to send you the price directly? It's ${agent}, here to help 🌿`,
  fr: (name, agent) => `J'ai vu que vous avez lu mon message! 👀${name ? ` ${name}` : ""} Des questions, ou je vous envoie le prix directement? C'est ${agent} 🌿`,
  it: (name, agent) => `Ho visto che hai letto il mio messaggio! 👀${name ? ` ${name}` : ""} Hai dubbi o vuoi che ti passi il prezzo diretto? Sono ${agent} 🌿`,
  de: (name, agent) => `Ich habe gesehen, dass Sie meine Nachricht gelesen haben! 👀${name ? ` ${name}` : ""} Noch Fragen, oder soll ich Ihnen direkt den Preis schicken? Hier ist ${agent} 🌿`,
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
      const msg = msgFn(lead.name, agentName);

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
      es: (name, agent, owner, country) => `Hola${name ? ` ${name}` : ""} 👋 Soy ${agent} del equipo PowerVita.\nSolo quería contarte: esta semana tuvimos varios pedidos de ${country} con el pack que te recomendé y los resultados de las primeras clientas son muy buenos 🌿\n¿Seguís con dudas o te paso el precio con ${owner} ahora mismo?`,
      pt: (name, agent, owner, country) => `Olá${name ? ` ${name}` : ""} 👋 Sou ${agent} da equipe PowerVita.\nSó queria te contar: essa semana tivemos vários pedidos de ${country} com o pack que recomendei e os resultados são ótimos 🌿\nAinda tem dúvidas ou posso te passar o preço com ${owner} agora?`,
      en: (name, agent, owner, country) => `Hey${name ? ` ${name}` : ""} 👋 It's ${agent} from PowerVita.\nJust wanted to let you know — we had several orders from ${country} with the pack I recommended and early results are great 🌿\nStill have questions, or should I get you the price with ${owner} now?`,
      fr: (name, agent, owner, country) => `Bonjour${name ? ` ${name}` : ""} 👋 C'est ${agent} de PowerVita.\nJe voulais juste vous dire — nous avons eu plusieurs commandes de ${country} cette semaine et les résultats sont très bons 🌿\nDes questions encore, ou je vous passe le prix avec ${owner} maintenant?`,
      it: (name, agent, owner, country) => `Ciao${name ? ` ${name}` : ""} 👋 Sono ${agent} di PowerVita.\nVolevo dirti — abbiamo avuto diversi ordini da ${country} questa settimana e i risultati iniziali sono ottimi 🌿\nHai ancora domande o ti passo il prezzo con ${owner} adesso?`,
      de: (name, agent, owner, country) => `Hallo${name ? ` ${name}` : ""} 👋 Hier ist ${agent} von PowerVita.\nIch wollte Ihnen kurz mitteilen — wir hatten diese Woche mehrere Bestellungen aus ${country} und die ersten Ergebnisse sind sehr gut 🌿\nNoch Fragen, oder soll ich Sie jetzt mit ${owner} für den Preis verbinden?`,
    },
  },
  {
    stage: 1,
    hoursAfter: 24,
    statusRequired: "followup_1",
    nextStatus: "followup_2",
    msgs: {
      es: (name, agent, owner, country) => `Hola${name ? ` ${name}` : ""}, soy ${agent} otra vez 😊\nMirá, quiero ser honesta: Andrés está cerrando los pedidos de ${country} esta semana y hay precio especial para primeras compras. Si arrancás ahora, llegás a tiempo.\nEl pack que te recomendé es exactamente lo que necesitás para lo que me contaste. ¿Le digo que te escriba hoy?`,
      pt: (name, agent, owner, country) => `Olá${name ? ` ${name}` : ""}, sou ${agent} de novo 😊\nOlha, quero ser honesta: Andrés está fechando os pedidos de ${country} essa semana e há preço especial para primeiras compras.\nO pack que recomendei é exatamente o que você precisa. Posso dizer para ele te escrever hoje?`,
      en: (name, agent, owner, country) => `Hey${name ? ` ${name}` : ""}, it's ${agent} again 😊\nI want to be honest with you: Andrés is closing orders from ${country} this week and there's a special price for first purchases. If you start now, you're in time.\nShould I tell him to write to you today?`,
      fr: (name, agent, owner, country) => `Bonjour${name ? ` ${name}` : ""}, c'est ${agent} encore 😊\nJe veux être honnête : Andrés ferme les commandes de ${country} cette semaine avec un prix spécial pour les premiers achats.\nDois-je lui dire de vous écrire aujourd'hui?`,
      it: (name, agent, owner, country) => `Ciao${name ? ` ${name}` : ""}, sono ${agent} di nuovo 😊\nVoglio essere onesta: Andrés sta chiudendo gli ordini da ${country} questa settimana con un prezzo speciale per i primi acquisti.\nDevo dirgli di scriverti oggi?`,
      de: (name, agent, owner, country) => `Hallo${name ? ` ${name}` : ""}, hier ist ${agent} nochmal 😊\nIch möchte ehrlich sein: Andrés schließt diese Woche Bestellungen aus ${country} mit Sonderpreis für Erstkäufe.\nSoll ich ihm sagen, dass er Sie heute kontaktiert?`,
    },
  },
  {
    stage: 2,
    hoursAfter: 96,
    statusRequired: "followup_2",
    nextStatus: "cold",
    msgs: {
      es: (name, agent, owner, country) => `Hola${name ? ` ${name}` : ""} 😊 Soy ${agent}, último mensaje de mi parte, no quiero molestarte.\nSolo te dejo esto: el problema que me contaste no se va solo. Cada semana sin hacer algo es una semana más con eso.\nSi en algún momento decidís arrancar, ${owner} puede armar tu pack para ${country} en minutos. Acá vamos a estar 🌿`,
      pt: (name, agent, owner, country) => `Olá${name ? ` ${name}` : ""} 😊 Sou ${agent}, última mensagem da minha parte.\nSó quero deixar uma coisa: o problema que você me contou não some sozinho. Cada semana sem fazer nada é mais uma semana com isso.\nQuando decidir começar, ${owner} pode montar seu pack para ${country} em minutos 🌿`,
      en: (name, agent, owner, country) => `Hey${name ? ` ${name}` : ""} 😊 It's ${agent} — last message from me, I don't want to be a bother.\nJust leaving you with this: the problem you told me about doesn't go away on its own. Every week without doing something is another week with it.\nWhen you're ready, ${owner} can put together your pack for ${country} in minutes 🌿`,
      fr: (name, agent, owner, country) => `Bonjour${name ? ` ${name}` : ""} 😊 C'est ${agent} — dernier message de ma part.\nJuste une chose : le problème dont vous m'avez parlé ne disparaît pas seul. Chaque semaine sans agir est une semaine de plus avec ça.\nQuand vous serez prêt(e), ${owner} peut préparer votre pack pour ${country} en quelques minutes 🌿`,
      it: (name, agent, owner, country) => `Ciao${name ? ` ${name}` : ""} 😊 Sono ${agent} — ultimo messaggio da parte mia.\nSolo questo: il problema che mi hai raccontato non scompare da solo. Ogni settimana senza fare nulla è un'altra settimana con quello.\nQuando sei pronto/a, ${owner} può preparare il tuo pack per ${country} in pochi minuti 🌿`,
      de: (name, agent, owner, country) => `Hallo${name ? ` ${name}` : ""} 😊 Hier ist ${agent} — letzte Nachricht von mir.\nNur eines: Das Problem, das Sie mir erzählt haben, verschwindet nicht von alleine. Jede Woche ohne etwas zu tun ist eine weitere Woche damit.\nWenn Sie bereit sind, kann ${owner} Ihr Pack für ${country} in Minuten zusammenstellen 🌿`,
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
];

async function runFollowUps() {
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
        const msg = msgFn(lead.name, agentName, OWNER_NAME, lead.country || "tu país");

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

// Health check
app.get("/health", (_req, res) =>
  res.json({ status: "ok", ts: new Date().toISOString(), bot: "PowerVita FuXion Bot" })
);

// ── SERVER START ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 PowerVita Bot running on port ${PORT}`);
  console.log(`🌍 Webhook: POST /webhook`);
  console.log(`💚 Health:  GET  /health`);
});

// Run follow-ups every hour
setInterval(runFollowUps, 60 * 60 * 1000);
setTimeout(runFollowUps, 30_000); // First run 30s after start
