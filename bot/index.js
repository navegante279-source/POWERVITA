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
  FUXION_BUY_LINK = "https://ifuxion.com/andresvarela/enrollment/chooseperson",
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
  const expected = "sha256=" + crypto
    .createHmac("sha256", WEBHOOK_APP_SECRET)
    .update(req.rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// ── PRODUCTS UNAVAILABLE BY COUNTRY ──────────────────────────
const COUNTRY_UNAVAILABLE = {
  "Uruguay":        ["Pre Sport", "Xpeed", "Alpha Balance", "Rexet"],
  "Argentina":      ["Prunex 1", "Xpeed"],
  "Colombia":       ["Prunex 1", "Pre Sport"],
  "México":         ["Prunex 1"],
  "España":         ["Prunex 1", "Pre Sport"],
  "Brasil":         ["Prunex 1"],
  "Chile":          ["Prunex 1"],
  "Perú":           [],
  "Estados Unidos": ["Prunex 1"],
};

function getUnavailableProducts(country) {
  return COUNTRY_UNAVAILABLE[country] || [];
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

// ── LANGUAGE INSTRUCTIONS ─────────────────────────────────────
const LANG_INSTRUCTIONS = {
  es: "Responde SIEMPRE en español. Tono cálido y cercano.",
  pt: "Responda SEMPRE em português brasileiro. Tom caloroso e próximo.",
  en: "ALWAYS respond in English. Warm and friendly tone.",
  fr: "Répondez TOUJOURS en français. Ton chaleureux et proche.",
  it: "Rispondi SEMPRE in italiano. Tono caldo e vicino.",
  de: "Antworte IMMER auf Deutsch. Warmer und freundlicher Ton.",
};

// ── SYSTEM PROMPT ─────────────────────────────────────────────
function buildSystemPrompt(phone, agentName, countryInfo) {
  const { country, lang } = countryInfo;
  const langInstruction = LANG_INSTRUCTIONS[lang] || "Respond in the same language the client uses.";
  const inHours = isBusinessHours();
  const unavailable = getUnavailableProducts(country);
  const unavailableText = unavailable.length
    ? `PRODUCTOS NO DISPONIBLES EN ${country.toUpperCase()}: ${unavailable.join(", ")} — NUNCA los recomiendes a este cliente.`
    : `Todos los productos están disponibles en ${country}.`;

  return `Eres ${agentName}, asesora de bienestar del equipo PowerVita FuXion. Nunca menciones proactivamente que eres IA o bot.

IDIOMA: ${langInstruction}
PAÍS DEL CLIENTE: ${country}
HORARIO LABORAL ACTIVO: ${inHours ? "SÍ" : `NO — si el cliente pide precio o quiere comprar, indica que ${OWNER_NAME} atiende de 9am a 10pm`}

${unavailableText}

TU MISIÓN:
Identificar el objetivo de salud del cliente → recomendar el pack FuXion ideal (3 o 5 productos disponibles en su país) → conseguir que contacte a ${OWNER_NAME} para el precio y la compra.

ESTILO: Cálida, cercana, como una amiga que entiende de salud y bienestar. Máximo 3 párrafos por respuesta. Emojis con moderación.
FORMATO: Texto plano únicamente. NUNCA uses asteriscos (*), guiones bajos (_), ni ningún símbolo de markdown para resaltar. Solo texto corrido y emojis.

REGLAS CRÍTICAS:
- NUNCA menciones precios (varían por país, los maneja ${OWNER_NAME} directamente)
- La landing ${LANDING_URL} muestra el catálogo de productos, NO los precios
- Si el cliente pregunta el PRECIO o quiere COMPRAR de un producto específico: primero respondé con 2-3 beneficios concretos del producto que mencionó (genera deseo), luego una línea de prueba social, y al final decí "¿Querés que te pase con Andrés para el precio ahora mismo?" y añade [TRANSFER_NEEDED]. Ejemplo: si preguntan precio de Thermo T3 → explicá que activa el metabolismo, quema grasa con 3 tipos de té y L-Carnitina, que miles de personas en su país lo usan, y luego ofrecé el precio con Andrés.
- Si el cliente pregunta precio SIN mencionar producto específico: antes de transferir, preguntá qué objetivo tiene para recomendarle el pack más adecuado, y recién después de recomendar el pack ofrecé el precio con Andrés.
- Si preguntan si eres bot/IA/real: responde cálidamente que eres parte del equipo y añade [TRANSFER_NEEDED]
- Si piden hablar con una persona: responde que los conectas y añade [TRANSFER_NEEDED]
- Si no entiendes el mensaje 2 veces seguidas: añade [TRANSFER_NEEDED]

FLUJO IDEAL:
1. BIENVENIDA: Saludo cálido + mención breve de privacidad + pregunta sobre su objetivo principal
2. PROFUNDIZAR: 1-2 preguntas específicas según el objetivo detectado
3. RECOMENDACIÓN: Pack personalizado (solo productos disponibles en ${country}) con beneficio específico
4. CTA: "¿Querés que te pase el precio para ${country}? Te conecto con Andrés ahora" → [TRANSFER_NEEDED]
5. Prueba social: "Muchas personas en ${country} ya están viendo resultados con este pack 💪"

CATÁLOGO FUXION:
🌿 DETOX/DIGESTIÓN: Prunex 1 (tránsito intestinal), Flora Liv (probióticos), Liquid Fibra (fibra soluble), Alpha Balance (pH alcalino), Rexet (desintox hígado), Berry Balance (tracto urinario)
💪 PROTEÍNAS: Biopro+ Fit (quemar grasa + músculo), Biopro+ Sport (masa muscular magra), Biopro+ Tect (sistema inmune), Protein Active (100% vegetal)
⚡ ENERGÍA: Vita Xtra T+ (fatiga y antioxidantes), Nutraday (multivitamínico familiar), Xpeed (energía inmediata)
⚖️ CONTROL DE PESO: Thermo T3 (termogénico, quema grasa), Nocarb-T (bloquea carbohidratos), Café & Café Fit (apetito y azúcar), Chocolate Fit (ansiedad + medidas)
🛡️ INMUNIDAD: Vera+ (aloe vera + betaglucanos), Gano Excel / Café Gano (hongo Ganoderma)
✨ ANTIEDAD: Youth Elixir (regeneración celular nocturna), Beauty In (colágeno piel/cabello/uñas), Golden FLX (articulaciones), Passion (vigor y circulación)
🧠 MENTAL: On (concentración, memoria, foco), No Stress (ansiedad, equilibrio nervioso)
🏃 DEPORTE: Pre Sport (rendimiento pre-entreno), Post Sport (recuperación BCAA), Xpeed (potencia)

PACKS RECOMENDADOS (según objetivo):
🔥 BAJAR DE PESO
  Pack Starter (3): Prunex 1 + Thermo T3 + Nocarb-T
  Pack Completo (5): + Liquid Fibra + Café & Café Fit

💪 GANAR MÚSCULO / RENDIMIENTO
  Pack Starter (3): Biopro+ Sport + Pre Sport + Post Sport
  Pack Completo (5): + Xpeed + Alpha Balance

🛡️ FORTALECER DEFENSAS
  Pack Starter (3): Vera+ + Biopro+ Tect + Alpha Balance
  Pack Completo (5): + Berry Balance + Rexet

✨ ANTIEDAD / PIEL Y ARTICULACIONES
  Pack Starter (3): Beauty In + Youth Elixir + Golden FLX
  Pack Completo (5): + Passion + Berry Balance

🧠 ENERGÍA Y CONCENTRACIÓN
  Pack Starter (3): On + Vita Xtra T+ + No Stress
  Pack Completo (5): + Nutraday + Café & Café Fit

😴 ESTRÉS Y DESCANSO
  Pack Starter (3): No Stress + Youth Elixir + Flora Liv
  Pack Completo (5): + Vera+ + Golden FLX

🌿 DETOX COMPLETO
  Pack Starter (3): Prunex 1 + Flora Liv + Alpha Balance
  Pack Completo (5): + Liquid Fibra + Rexet

PRIVACIDAD (úsalo en el primer mensaje): "🔒 Tu información es confidencial y se usa únicamente para recomendarte los mejores productos."
PRUEBA SOCIAL (úsalo al recomendar): "Muchas personas en ${country} ya están transformando su salud con FuXion 💪"

Eres ${agentName} del equipo PowerVita. Profesional, cálida, persuasiva — nunca presionante.`;
}

// ── AI RESPONSE ───────────────────────────────────────────────
async function getAIResponse(phone, userMessage, history, agentName, countryInfo) {
  const systemPrompt = buildSystemPrompt(phone, agentName, countryInfo);

  const messages = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: userMessage },
  ];

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
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

async function notifyOwner(clientPhone, clientName, summary) {
  const msg =
    `🔔 *TRANSFERENCIA — PowerVita Bot*\n\n` +
    `👤 Cliente: *${clientName || "Sin nombre"}*\n` +
    `📱 Número: ${clientPhone}\n\n` +
    `📋 Resumen:\n${summary}\n\n` +
    `👉 El cliente quiere atención personalizada.`;
  return sendWAMessage(OWNER_PHONE, msg);
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

    // Get AI response
    let aiResponse;
    try {
      aiResponse = await getAIResponse(phone, text, history, agentName, countryInfo);
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
    ].slice(-20);

    // Save state
    await saveConversation(phone, {
      history,
      retries,
      transferred: needsTransfer,
      last_message_at: new Date().toISOString(),
    });
    await saveLead(phone, {
      name: contactName,
      country: countryInfo.country,
      lang: countryInfo.lang,
      status: needsTransfer ? "transferred" : "active",
    });

    // Send response
    await sendWAMessage(phone, sanitizeForWhatsApp(cleanResponse));

    // Notify owner if needed
    if (needsTransfer) {
      const summary = history
        .slice(-6)
        .map((h) => `${h.role === "user" ? "Cliente" : agentName}: ${h.content}`)
        .join("\n");
      await notifyOwner(phone, contactName, summary);
    }

    console.log(`✅ Responded to ${phone} [${countryInfo.country}]${needsTransfer ? " → TRANSFERRED" : ""}`);
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
    hoursAfter: 24,
    statusRequired: "active",
    nextStatus: "followup_1",
    msgs: {
      es: (name, agent, owner) => `¡Hola${name ? ` ${name}` : ""}! 👋 Soy ${agent} del equipo PowerVita. Solo quería saber si pudiste ver la información que te compartí 😊 Cualquier duda que tengas, estoy aquí para ayudarte. ¡Tu bienestar no puede esperar! 💪`,
      pt: (name, agent) => `Olá${name ? ` ${name}` : ""}! 👋 Sou ${agent} do time PowerVita. Só queria saber se conseguiu ver as informações 😊 Qualquer dúvida, estou aqui! 💪`,
      en: (name, agent) => `Hey${name ? ` ${name}` : ""}! 👋 I'm ${agent} from PowerVita. Just checking if you had a chance to look at what I shared 😊 I'm here if you have any questions! 💪`,
      fr: (name, agent) => `Bonjour${name ? ` ${name}` : ""}! 👋 Je suis ${agent} de PowerVita. Je voulais juste savoir si vous avez pu consulter les infos 😊 Je suis là pour vous aider! 💪`,
      it: (name, agent) => `Ciao${name ? ` ${name}` : ""}! 👋 Sono ${agent} di PowerVita. Volevo solo controllare se hai visto le informazioni 😊 Sono qui per aiutarti! 💪`,
      de: (name, agent) => `Hallo${name ? ` ${name}` : ""}! 👋 Ich bin ${agent} von PowerVita. Ich wollte nur fragen, ob Sie die Informationen gesehen haben 😊 Ich helfe Ihnen gerne! 💪`,
    },
  },
  {
    stage: 1,
    hoursAfter: 48,
    statusRequired: "followup_1",
    nextStatus: "followup_2",
    msgs: {
      es: (name, agent, owner, country) => `¡Hola${name ? ` ${name}` : ""}! Soy ${agent} otra vez 😊\nQuiero contarte algo: muchas personas en ${country} que empezaron con FuXion este mes ya están notando cambios en su energía y digestión en menos de 2 semanas 🌿\nEl protocolo que te recomendé está diseñado exactamente para lo que me contaste. ¿Te cuento más o te paso directo con ${owner} para que te dé el precio?`,
      pt: (name, agent, owner, country) => `Olá${name ? ` ${name}` : ""}! Sou ${agent} novamente 😊\nMuitas pessoas em ${country} que começaram com FuXion já estão sentindo a diferença em menos de 2 semanas 🌿\nO protocolo que recomendei é perfeito para o que você me contou. Quer que eu te passe para ${owner} para o preço?`,
      en: (name, agent, owner, country) => `Hey${name ? ` ${name}` : ""}! It's ${agent} again 😊\nMany people in ${country} who started FuXion this month are already feeling the difference in under 2 weeks 🌿\nThe protocol I recommended is designed exactly for your situation. Want me to connect you with ${owner} for the price?`,
      fr: (name, agent, owner, country) => `Bonjour${name ? ` ${name}` : ""}! C'est ${agent} encore 😊\nBeaucoup de personnes en ${country} qui ont commencé FuXion ce mois-ci voient déjà des résultats en moins de 2 semaines 🌿\nVoulez-vous que je vous mette en contact avec ${owner} pour le prix?`,
      it: (name, agent, owner, country) => `Ciao${name ? ` ${name}` : ""}! Sono ${agent} di nuovo 😊\nMolte persone in ${country} che hanno iniziato FuXion stanno già notando la differenza in meno di 2 settimane 🌿\nVuoi che ti metta in contatto con ${owner} per il prezzo?`,
      de: (name, agent, owner, country) => `Hallo${name ? ` ${name}` : ""}! Hier ist ${agent} nochmal 😊\nViele Menschen in ${country} die diesen Monat mit FuXion begonnen haben, spüren bereits den Unterschied in weniger als 2 Wochen 🌿\nSoll ich Sie mit ${owner} für den Preis verbinden?`,
    },
  },
  {
    stage: 2,
    hoursAfter: 120,
    statusRequired: "followup_2",
    nextStatus: "cold",
    msgs: {
      es: (name, agent) => `Hola${name ? ` ${name}` : ""} 😊 Soy ${agent}, último mensaje de mi parte para no molestarte.\nEntiendo que quizás no es el momento ideal, y está perfecto. Cuando estés lista, acá vamos a estar 🌿\nSolo recordarte que el catálogo completo de FuXion está en ${LANDING_URL} para que lo veas cuando quieras. ¡Que tengas un excelente día! ✨`,
      pt: (name, agent) => `Olá${name ? ` ${name}` : ""} 😊 Sou ${agent}, última mensagem da minha parte.\nEntendo que talvez não seja o momento certo, tudo bem. Quando estiver pronta, estaremos aqui 🌿\n¡Tenha um ótimo dia! ✨`,
      en: (name, agent) => `Hey${name ? ` ${name}` : ""} 😊 It's ${agent} — last message from me, I don't want to bother you.\nI understand if the timing isn't right, and that's perfectly okay. Whenever you're ready, we'll be here 🌿\nHave a wonderful day! ✨`,
      fr: (name, agent) => `Bonjour${name ? ` ${name}` : ""} 😊 C'est ${agent} — dernier message de ma part.\nJe comprends si ce n'est pas le bon moment, c'est tout à fait normal. Quand vous serez prêt(e), nous serons là 🌿 Bonne journée! ✨`,
      it: (name, agent) => `Ciao${name ? ` ${name}` : ""} 😊 Sono ${agent} — ultimo messaggio da parte mia.\nCapisco se non è il momento giusto, va benissimo. Quando sei pronto/a, saremo qui 🌿 Buona giornata! ✨`,
      de: (name, agent) => `Hallo${name ? ` ${name}` : ""} 😊 Hier ist ${agent} — letzte Nachricht von mir.\nIch verstehe, wenn es gerade nicht der richtige Zeitpunkt ist. Wenn Sie bereit sind, sind wir hier 🌿 Einen schönen Tag! ✨`,
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
              es: "¡Hola! 😊 Parece que el audio no se escuchó bien. ¿Podrías escribirme tu consulta? Así te ayudo mejor 📝",
              pt: "Olá! 😊 Parece que o áudio não ficou bom. Você poderia me escrever sua dúvida? Assim consigo te ajudar melhor 📝",
              en: "Hey! 😊 It seems the audio didn't come through clearly. Could you write your question? That way I can help you better 📝",
              fr: "Bonjour! 😊 Il semble que l'audio n'est pas passé. Pourriez-vous écrire votre question? Je pourrai mieux vous aider 📝",
              it: "Ciao! 😊 Sembra che l'audio non sia arrivato bene. Potresti scrivere la tua domanda? Così riesco ad aiutarti meglio 📝",
              de: "Hallo! 😊 Es scheint, dass die Sprachnachricht nicht angekommen ist. Könnten Sie Ihre Frage schreiben? So kann ich Ihnen besser helfen 📝",
            };
            const reply = audioReplies[countryInfo.lang] || audioReplies.es;
            sendWAMessage(phone, reply);
            continue;
          }

          if (msg.type !== "text") continue;
          const text = msg.text.body;
          console.log(`📨 [${phone}] ${name}: ${text}`);
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
