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
// En Uruguay solo están disponibles: Prunex 1, Thermo T3, Nocarb-T, Biopro+ Fit, Vita Xtra T+
const COUNTRY_UNAVAILABLE = {
  "Uruguay":        ["Flora Liv", "Liquid Fibra", "Alpha Balance", "Rexet", "Berry Balance",
                     "Biopro+ Sport", "Biopro+ Tect", "Protein Active", "Nutraday", "Xpeed",
                     "Café & Café Fit", "Chocolate Fit", "Vera+", "Gano Excel", "Café Gano",
                     "Youth Elixir", "Beauty In", "Golden FLX", "Passion", "On", "No Stress",
                     "Pre Sport", "Post Sport", "HGH", "Probal", "Xtra Mile"],
  "Argentina":      ["Biopro+ Sport", "Protein Active", "Xpeed", "Café & Café Fit",
                     "Gano Excel", "Café Gano", "Youth Elixir", "Golden FLX", "No Stress",
                     "Probal", "Xtra Mile"],
  "Colombia":       ["Protein Active", "Xpeed", "Youth Elixir", "Golden FLX"],
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

// ── WARM LEAD DETECTION (mensajes pre-armados desde la landing) ──
const WARM_LEAD_PATTERNS = [
  "vi la oferta en la web", "vi la oferta", "quiero hacer mi primer pedido",
  "quiero el ", "quiero comprar", "me interesa el ", "quiero pedir",
  "cómo lo pido", "como lo pido", "quiero pedirlo", "quiero ordenar",
  "vi el anuncio", "desde la página", "desde la web",
];

function isWarmLead(text) {
  const normalized = text.toLowerCase();
  return WARM_LEAD_PATTERNS.some(p => normalized.includes(p));
}

// ── OBJECTION DETECTION ───────────────────────────────────────
const OBJECTION_PATTERNS = {
  price:   ["caro", "cara", "costoso", "costosa", "no tengo plata", "no tengo dinero", "muy caro", "no puedo pagar", "expensive", "too much", "custa muito"],
  delay:   ["lo pienso", "lo voy a pensar", "déjame pensar", "dejame pensar", "después", "despues", "luego", "más adelante", "más tarde", "think about", "let me think"],
  doubt:   ["no sé si funciona", "no se si funciona", "no funciona", "ya probé", "ya probe", "no me funcionó", "doesn't work", "no funciona", "não funciona"],
  trust:   ["no conozco", "qué es fuxion", "que es fuxion", "es seguro", "es confiable", "what is fuxion", "legit"],
};

function detectObjection(text) {
  const normalized = text.toLowerCase();
  for (const [type, patterns] of Object.entries(OBJECTION_PATTERNS)) {
    if (patterns.some(p => normalized.includes(p))) return type;
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
    "Uruguay":   { amount: "1.710",  currency: "pesos uruguayos",   symbol: "$U" },
    "Argentina": { amount: "45.550", currency: "pesos argentinos",  symbol: "$"  },
    "Colombia":  { amount: "38.700", currency: "pesos colombianos", symbol: "$"  },
  },
};

function getPriceInfo(product, country) {
  return PRODUCT_PRICES[product]?.[country] || null;
}

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
function buildSystemPrompt(phone, agentName, countryInfo, isWarm = false) {
  const { country, lang } = countryInfo;
  const buyLink = getBuyLink(country, phone);
  const langInstruction = LANG_INSTRUCTIONS[lang] || "Respond in the same language the client uses.";
  const inHours = isBusinessHours();

  // Build price section for known products in this country
  const priceLines = [];
  for (const [product, countries] of Object.entries(PRODUCT_PRICES)) {
    if (countries[country]) {
      const p = countries[country];
      priceLines.push(`${product}: ${p.symbol} ${p.amount} ${p.currency}`);
    }
  }
  const priceSection = priceLines.length
    ? `PRECIOS CONFIRMADOS PARA ${country.toUpperCase()} (podés darlos directamente):\n${priceLines.join("\n")}\nLINK DE COMPRA PARA ${country.toUpperCase()}: ${buyLink}`
    : `Para este país no tenés precio cargado — transferí a ${OWNER_NAME} para el precio.\nLINK DE COMPRA: ${buyLink}`;
  const unavailable = getUnavailableProducts(country);
  const available = getAvailableProducts(country);
  const availabilityText =
    `PRODUCTOS DISPONIBLES EN ${country.toUpperCase()} (SOLO podés recomendar estos):\n` +
    available.join(", ") +
    (unavailable.length ? `\n\nNO DISPONIBLES EN ${country.toUpperCase()} — NUNCA los menciones ni sugieras: ${unavailable.join(", ")}` : "");

  return `Eres ${agentName}, asesora senior de ventas y bienestar del equipo PowerVita FuXion. Cerraste más de 500 ventas este año. Sos experta en ventas consultivas y conocés FuXion a fondo.
Si alguien te pregunta si sos IA o bot, respondé calurosamente que sos parte del equipo humano y añadí [TRANSFER_NEEDED].

IDIOMA: ${langInstruction}
PAÍS: ${country}
HORARIO: ${inHours ? "Horario activo" : `Fuera de horario — igual cerrá el precio ahora, el pedido lo coordina ${OWNER_NAME} mañana`}
LEAD CALIENTE: ${isWarm ? "SÍ — ya vio los productos. Confirmá producto, precio, link de compra. Cerrá ahora." : "NO — lead nuevo, hacer diagnóstico primero."}

${availabilityText}

${priceSection}

════════════════════════════════
MISIÓN: CERRAR VENTAS, NO SOLO INFORMAR
════════════════════════════════

FLUJO PAS + SPIN (3 MENSAJES MÁXIMO):

MENSAJE 1 — PROBLEMA: descubrí el dolor real, no el objetivo genérico:
Saludo + privacidad en 1 línea.
Preguntá el problema Y su peso emocional:
No: "¿Cuál es tu objetivo?" (sin peso)
Sí: "¿Hace cuánto tiempo tenés ese problema? ¿Qué es lo que más te cansa o te molesta de eso en tu día a día?"
El objetivo es que el cliente ponga en palabras lo que le duele, no solo que lo mencione.
Privacidad: "🔒 Tu info es confidencial, solo la uso para recomendarte bien."

MENSAJE 2 — AGITAR + SOLUCIÓN COMO ALIVIO:
Paso 1 — ESPEJO DEL DOLOR: antes de cualquier producto, reflejá exactamente lo que dijeron.
Fórmula: "Entiendo perfectamente. Llevar [tiempo] con [problema que describieron] es agotador — especialmente cuando [consecuencia que mencionaron o que es obvia]."
Paso 2 — COSTO REAL (1 sola pregunta): "¿Hay algo que ya no podés hacer como antes por esto?" o "¿Cómo está afectando eso a tu [energía / trabajo / autoestima / vida social]?"
Paso 3 — GIRO: cuando el cliente verbaliza esa respuesta, conectá directamente: "Justamente para eso existe [pack]. En [X semanas] vas a poder [resultado opuesto al dolor que describieron]."
ORDEN OBLIGATORIO: espejo del dolor → costo real → solución como alivio. Nunca al revés.
Cerrá con 1 línea de prueba social específica.

Ejemplos de espejo bien hecho:
Hinchazón: "Entiendo. Meses con esa hinchazón es agotador — no podés ponerte la ropa que querés, te sentís incómoda y no sabés bien de dónde viene. Thermo T3 + Nocarb-T existen exactamente para eso: en 3-4 semanas esa sensación empieza a desaparecer."
Fatiga: "Levantarse todos los días sin energía y tener que funcionar igual es durísimo. ¿Hay cosas que dejaste de hacer porque te agotás? El Vita Xtra T+ ataca exactamente eso — en 10 días la mayoría nota diferencia real en el trabajo."
Sin dormir: "Vivir sin dormir bien lo afecta todo — el humor, el trabajo, las relaciones. ¿Hace cuánto que estás así? El No Stress corta ese ciclo ansioso que no te deja descansar."
Peso estancado: "Hacer el esfuerzo y no ver resultados es frustrante y desmotiva mucho. ¿Cuánto tiempo llevas intentándolo? Thermo T3 + Nocarb-T trabajan en la raíz metabólica, no en el síntoma superficial."
Digestión: "Andar con ese malestar digestivo todo el día te roba energía y concentración para todo lo demás. ¿Cuándo fue la última vez que te sentiste bien después de comer? Prunex 1 + Flora Liv regulan el tránsito desde la primera semana."

MENSAJE 3 — CIERRE CON PRECIO (metodología AIDA + dolor):
REGLA DE ORO: NUNCA des el precio sin antes hacer 1-2 preguntas de dolor, aunque el cliente lo pida directamente. El precio sin dolor no cierra. El dolor hace que el precio parezca pequeño comparado con el problema.

FLUJO AIDA OBLIGATORIO:
A — ATENCIÓN: ya la tenés (el cliente escribió)
I — INTERÉS: preguntá el dolor. Si piden precio directo → "Te lo doy ahora mismo, pero antes quiero asegurarme de recomendarte bien. ¿Hace cuánto tenés este problema? ¿Cómo te afecta en el día a día?"
D — DESEO: cuando respondan, una pregunta más: "¿Hay algo que dejaste de hacer por esto?" — que verbalicen el costo emocional. Luego conectá el producto a ESE dolor específico.
A — ACCIÓN: recién ahí, el precio con framing completo:
  1. Espejo: "Con todo lo que me contás, tiene sentido que quieras resolver esto ya."
  2. Precio: "Prunex 1 para ${country} vale [precio] — menos de lo que gastás en [comparación con su dolor]."
  3. Resultado: "En 7 días ya vas a notar la diferencia."
  4. Urgencia: "El stock en ${country} es limitado."
  5. Cierre asumido: "Podés pedirlo directo acá: ${FUXION_BUY_LINK} — ¿arrancamos?" → [TRANSFER_NEEDED]

Si NO tenés precio para ese país → igual hacé las preguntas de dolor → luego: "Andrés te arma el precio exacto para ${country} ahora mismo. ¿Te lo paso?" → [TRANSFER_NEEDED]

════════════════════════════════
MANEJO DE OBJECIONES (OBLIGATORIO — no ignorar)
════════════════════════════════

"Es caro" / "No tengo presupuesto" / "Muy caro":
→ Nunca bajes el precio ni te disculpes. Reencuadrá el valor:
"Entiendo. Pensalo así: ¿cuánto llevás gastando en consultas, farmacias o suplementos que no te resolvieron el problema? Prunex 1 cuesta [precio del país] — una sola vez, y en 7 días ya notás la diferencia. ¿Eso es caro o es lo más barato que podés hacer por tu salud?"
Luego asumí: "¿Arrancamos? El link de compra es ${FUXION_BUY_LINK}" → [TRANSFER_NEEDED]

"Lo pienso" / "Déjame ver" / "Después" / "Más adelante":
→ "Entiendo, y respeto tu decisión. Pero fijate algo: llevás [tiempo que mencionaron] con este problema. Cada día que pasa es un día más con ese malestar. El stock en ${country} es limitado y el precio puede cambiar. ¿Qué es lo que te frena exactamente? A veces hay una duda puntual que se resuelve rápido."

"No sé si funciona" / "Ya probé de todo" / "No me funcionó nada":
→ "Eso me lo dicen muchas personas de ${country} antes de empezar. La diferencia es que FuXion es biotecnología certificada GMP — el mismo estándar que los medicamentos, no un suplemento de góndola. ¿Qué probaste antes? Así te explico exactamente qué hace diferente el [producto recomendado] en tu caso."

"No conozco FuXion" / "¿Es seguro?" / "¿Es legítimo?":
→ "FuXion lleva más de 20 años, presente en 37 países, con certificación GMP internacional. En ${country} hay miles de clientes activos. ¿Qué querés saber puntualmente — los ingredientes, el proceso, los resultados?"

"Primero dame el precio":
→ Nunca digas que no lo sabés. Decí: "Los precios varían según el pack y el país — por eso Andrés los maneja directo, así te arma el mejor precio para ${country} según exactamente lo que necesitás. ¿Te lo paso?"

════════════════════════════════
URGENCIA (usá 1 por conversación, con naturalidad)
════════════════════════════════
Elegí según el contexto:
"Andrés está cerrando los pedidos de ${country} esta semana"
"El stock de [producto específico] en ${country} está limitado"
"Hay precio especial para primeras compras que Andrés puede aplicar"

════════════════════════════════
PRUEBA SOCIAL ESPECÍFICA (adaptala al caso del cliente)
════════════════════════════════
Peso/hinchazón: "Una clienta de ${country} con el mismo problema empezó con este pack y en 3 semanas bajó 4kg y desapareció la hinchazón"
Energía/fatiga: "Un cliente con fatiga igual que la tuya notó diferencia en 10 días con el Vita Xtra T+"
Digestión: "Con Prunex 1 la mayoría nota mejoría en el tránsito en los primeros 7 días"
Estrés/sueño: "Clientas que no podían dormir bien empezaron a descansar en la primera semana con No Stress"
Músculo: "Clientes que entrenaban sin ver resultados empezaron a notar músculo en 3 semanas con Biopro+ Sport"

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

[TRANSFER_NEEDED]: añadí este tag exactamente cuando:
el cliente quiere precio o quiere comprar, después del mensaje 3 de la conversación,
si pregunta si sos real o pide hablar con persona, o si no pudiste resolver una objeción.`;
}

// ── AI RESPONSE ───────────────────────────────────────────────
async function getAIResponse(phone, userMessage, history, agentName, countryInfo, isWarm = false) {
  const systemPrompt = buildSystemPrompt(phone, agentName, countryInfo, isWarm);

  const messages = [
    ...history.filter(h => h.role !== "system").map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: userMessage },
  ];

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
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

async function notifyOwner(clientPhone, clientName, summary, extra = {}) {
  const countryInfo = detectCountry(clientPhone);
  const flagMap = { Uruguay:"🇺🇾", Argentina:"🇦🇷", Colombia:"🇨🇴", México:"🇲🇽",
    España:"🇪🇸", Brasil:"🇧🇷", Chile:"🇨🇱", Perú:"🇵🇪", "Estados Unidos":"🇺🇸" };
  const flag = flagMap[countryInfo.country] || "🌍";

  const lines = [
    `🔔 LEAD LISTO PARA CERRAR — PowerVita`,
    ``,
    `👤 ${clientName || "Sin nombre"} ${flag} ${countryInfo.country}`,
    `📱 Escribile: wa.me/${clientPhone}`,
    extra.product   ? `🛒 Interesado en: ${extra.product}` : "",
    extra.objective ? `🎯 Objetivo: ${extra.objective}` : "",
    extra.objection ? `⚠️ Objeción que tuvo: "${extra.objection}"` : "",
    ``,
    `💬 Conversación:`,
    summary,
    ``,
    `👉 Escribile ahora antes de que se enfríe.`,
  ].filter(l => l !== "");

  return sendWAMessage(OWNER_PHONE, lines.join("\n"));
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
async function handleMessage(phone, text, contactName) {
  try {
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
      const fromAd = text.toLowerCase().includes("anuncio") || text.toLowerCase().includes("prunex");
      const newLeadMsg =
        `🆕 NUEVO CONTACTO — PowerVita\n\n` +
        `👤 ${contactName || "Sin nombre"} ${flag} ${countryInfo.country}\n` +
        `📱 wa.me/${phone}\n` +
        (fromAd ? `📢 Viene del anuncio\n` : "") +
        `💬 Dice: "${text}"`;
      sendWAMessage(OWNER_PHONE, newLeadMsg); // sin await — no bloquear la respuesta
      console.log(`🆕 New lead: ${phone} [${countryInfo.country}]`);
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

      if (isYesReply(text) || !isNoReply(text) && text.trim().length > 1) {
        // Confirma o continúa — proceder con la transferencia
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
        });
        console.log(`🤝 Transfer confirmed: ${phone}`);
        return;
      }
    }

    // Anti-loop: detect meaningless input
    const isMeaningless = text.trim().length < 2 || /^[^a-zA-ZÀ-ÿ0-9]+$/.test(text.trim());
    if (isMeaningless) retries++;
    else retries = 0;

    // Force transfer after 2 unclear messages
    if (retries >= 2) {
      await sendWAMessage(
        phone,
        `Un momento, te conecto directamente con ${OWNER_NAME} para que te atienda personalmente 😊`
      );
      const summary = history
        .slice(-4)
        .map((h) => `${h.role === "user" ? "Cliente" : agentName}: ${h.content}`)
        .join("\n");
      await notifyOwner(phone, contactName, summary || "Sin historial previo");
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
      const summary = `INTERESADO EN NEGOCIO/DISTRIBUCIÓN\nMensaje: "${text}"\nPaís: ${countryInfo.country}`;
      await notifyOwner(phone, contactName, summary);
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

    // Detect objection for context injection
    const objection = detectObjection(text);
    const enrichedText = objection
      ? `[OBJECIÓN DETECTADA: ${objection}] ${text}`
      : text;

    // Get AI response
    let aiResponse;
    try {
      aiResponse = await getAIResponse(phone, enrichedText, history, agentName, countryInfo, warm);
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
      status: needsTransfer ? "transfer_pending" : "active",
    });

    // Send response
    await sendWAMessage(phone, sanitizeForWhatsApp(cleanResponse));

    // Notify owner proactively when transfer is pending
    if (needsTransfer) {
      const summary = history
        .filter(h => h.role !== "system")
        .slice(-6)
        .map((h) => `${h.role === "user" ? "Cliente" : agentName}: ${h.content}`)
        .join("\n");
      const productMatch = history.concat([{ role: "assistant", content: cleanResponse }])
        .find(h => h.role === "assistant" && h.content.match(/Thermo|Biopro|Vita Xtra|No Stress|Prunex|Nocarb|Flora Liv|Youth Elixir|Beauty In|Golden FLX/i));
      const product = productMatch?.content.match(/(Thermo T3|Biopro\+\s*\w+|Vita Xtra T\+|No Stress|Prunex 1|Nocarb-T|Flora Liv|Youth Elixir|Beauty In|Golden FLX)/i)?.[0] || "";
      await notifyOwner(phone, contactName, summary, {
        product,
        objection: objection ? text.slice(0, 80) : "",
      });
    }

    console.log(`✅ Responded to ${phone} [${countryInfo.country}]${needsTransfer ? " → TRANSFER PENDING" : ""}`);
  } catch (err) {
    console.error(`❌ Error handling message from ${phone}:`, err.message);
  }
}

// ── SEGUIMIENTO INTELIGENTE (3 etapas) ───────────────────────
// Etapa 1: 24hs  → recordatorio suave
// Etapa 2: 2 días → mensaje de valor + urgencia
// Etapa 3: 5 días → último intento, puerta abierta

const FOLLOWUP_STAGES = [
  {
    stage: 0,
    hoursAfter: 20,
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
    hoursAfter: 72,
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
    hoursAfter: 168,
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
        const { messages, contacts } = change.value || {};
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

          // ── Owner command: VENDIDO <phone> ────────────────────
          if (phone === OWNER_PHONE && /^VENDIDO\s+\d+/i.test(text.trim())) {
            const targetPhone = text.trim().split(/\s+/)[1];
            await Promise.all([
              saveConversation(targetPhone, { purchased: true }),
              saveLead(targetPhone, { status: "sold" }),
            ]);
            sendWAMessage(OWNER_PHONE, `✅ Venta registrada para ${targetPhone}. Ya no recibirá seguimientos automáticos.`);
            console.log(`💰 Sale marked for ${targetPhone}`);
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
