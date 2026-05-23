// ============================================================
// POWERVITA FUXION BOT — Sistema Completo
// Stack: Node.js + Express + Anthropic Claude + Supabase
// WhatsApp: Meta Business API
// Países: Sudamérica, Centroamérica, Norteamérica, Europa
// ============================================================

import express from "express";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
app.use(express.json());

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

REGLAS CRÍTICAS:
- NUNCA menciones precios (varían por país, los maneja ${OWNER_NAME} directamente)
- La landing ${LANDING_URL} muestra el catálogo de productos, NO los precios
- Si el cliente pregunta el PRECIO o quiere COMPRAR: responde SOLO "Un momento, te paso con Andrés para que te dé el precio ahora mismo 😊" y añade [TRANSFER_NEEDED]. Nada más.
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

    // If already transferred to owner, stay silent
    if (conv?.transferred) return;

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
    await sendWAMessage(phone, cleanResponse);

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

// ── 24H FOLLOW-UP ─────────────────────────────────────────────
async function runFollowUps() {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: leads, error } = await supabase
      .from("leads")
      .select("*")
      .eq("status", "active")
      .lt("updated_at", cutoff);

    if (error) { console.error("Follow-up query error:", error.message); return; }
    if (!leads?.length) return;

    for (const lead of leads) {
      const conv = await getConversation(lead.phone);
      if (!conv || conv.transferred || conv.purchased) continue;

      const agentName = getAgentName(lead.phone);
      const msgs = {
        pt: `Olá de novo! 👋 Sou ${agentName} do time PowerVita. Só passando para ver se conseguiu revisar as informações 😊 Se quiser saber o preço para o seu país, posso te conectar com ${OWNER_NAME} agora mesmo. Estou aqui! 💪`,
        en: `Hi again! 👋 I'm ${agentName} from the PowerVita team. Just checking in — if you'd like to know the price for your country, I can connect you with ${OWNER_NAME} right now. I'm here to help! 💪`,
        fr: `Bonjour encore! 👋 Je suis ${agentName} de l'équipe PowerVita. Si vous souhaitez connaître le prix pour votre pays, je peux vous mettre en contact avec ${OWNER_NAME} maintenant 😊 💪`,
        it: `Ciao di nuovo! 👋 Sono ${agentName} del team PowerVita. Se vuoi sapere il prezzo per il tuo paese, posso metterti in contatto con ${OWNER_NAME} adesso 😊 💪`,
        de: `Hallo nochmal! 👋 Ich bin ${agentName} vom PowerVita-Team. Falls Sie den Preis für Ihr Land wissen möchten, verbinde ich Sie jetzt gerne mit ${OWNER_NAME} 😊 💪`,
        es: `¡Hola de nuevo! 👋 Soy ${agentName} del equipo PowerVita. Solo quería saber si pudiste revisar lo que te compartí 😊 Si querés saber el precio para tu país, te conecto con ${OWNER_NAME} ahora mismo. ¡Estoy aquí! 💪`,
      };

      const lang = lead.lang || "es";
      const msg = msgs[lang] || msgs.es;

      await sendWAMessage(lead.phone, msg);
      await saveLead(lead.phone, { status: "followed_up" });
      console.log(`📩 Follow-up sent to ${lead.phone}`);
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
  res.sendStatus(200); // Respond to Meta immediately

  try {
    const { object, entry } = req.body;
    if (object !== "whatsapp_business_account") return;

    for (const e of entry || []) {
      for (const change of e.changes || []) {
        const { messages, contacts } = change.value || {};
        if (!messages?.length) continue;

        for (const msg of messages) {
          if (msg.type !== "text") continue;
          const phone = msg.from;
          const text = msg.text.body;
          const name = contacts?.[0]?.profile?.name || "";
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
