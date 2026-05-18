/**
 * WhatsApp Cloud API Webhook Handler
 *
 * Required environment variables:
 *   WHATSAPP_TOKEN     - Meta WhatsApp Cloud API Bearer token
 *   WHATSAPP_PHONE_ID  - Phone Number ID from Meta dashboard
 *   VERIFY_TOKEN       - Webhook verification token (e.g. "powervita2024secreto")
 *   ANTHROPIC_API_KEY  - Anthropic API key
 *   SUPABASE_URL       - Supabase project URL
 *   SUPABASE_KEY       - Supabase service role key (secret)
 *   OWNER_PHONE        - Andrés's WhatsApp number without + (e.g. "59898950206")
 *   LANDING_URL        - https://powervita.vercel.app/
 */

// ---------------------------------------------------------------------------
// Lazy client getters (dynamic import to support ES module tree-shaking)
// ---------------------------------------------------------------------------

let _supabaseClientPromise = null;
function getSupabaseClient() {
  if (!_supabaseClientPromise) {
    _supabaseClientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
    );
  }
  return _supabaseClientPromise;
}

let _anthropicClientPromise = null;
function getAnthropicClient() {
  if (!_anthropicClientPromise) {
    _anthropicClientPromise = import('@anthropic-ai/sdk').then(({ default: Anthropic }) =>
      new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    );
  }
  return _anthropicClientPromise;
}

// ---------------------------------------------------------------------------
// Country detection (longest prefix first)
// ---------------------------------------------------------------------------

const COUNTRY_MAP = [
  // 4-digit prefixes
  { prefix: '1787', country: 'Puerto Rico',      lang: 'es' },
  { prefix: '1939', country: 'Puerto Rico',      lang: 'es' },
  // 3-digit prefixes
  { prefix: '506', country: 'Costa Rica',        lang: 'es' },
  { prefix: '502', country: 'Guatemala',         lang: 'es' },
  { prefix: '504', country: 'Honduras',          lang: 'es' },
  { prefix: '507', country: 'Panamá',            lang: 'es' },
  { prefix: '591', country: 'Bolivia',           lang: 'es' },
  { prefix: '593', country: 'Ecuador',           lang: 'es' },
  { prefix: '598', country: 'Uruguay',           lang: 'es' },
  { prefix: '357', country: 'Chipre',            lang: 'el' },
  { prefix: '385', country: 'Croacia',           lang: 'hr' },
  { prefix: '421', country: 'Eslovaquia',        lang: 'sk' },
  { prefix: '386', country: 'Eslovenia',         lang: 'sl' },
  { prefix: '372', country: 'Estonia',           lang: 'et' },
  { prefix: '358', country: 'Finlandia',         lang: 'fi' },
  { prefix: '353', country: 'Irlanda',           lang: 'en' },
  { prefix: '371', country: 'Letonia',           lang: 'lv' },
  { prefix: '370', country: 'Lituania',          lang: 'lt' },
  { prefix: '352', country: 'Luxemburgo',        lang: 'fr' },
  { prefix: '356', country: 'Malta',             lang: 'mt' },
  { prefix: '351', country: 'Portugal',          lang: 'pt' },
  // 2-digit prefixes
  { prefix: '54',  country: 'Argentina',         lang: 'es' },
  { prefix: '55',  country: 'Brasil',            lang: 'pt' },
  { prefix: '56',  country: 'Chile',             lang: 'es' },
  { prefix: '57',  country: 'Colombia',          lang: 'es' },
  { prefix: '51',  country: 'Perú',              lang: 'es' },
  { prefix: '52',  country: 'México',            lang: 'es' },
  { prefix: '49',  country: 'Alemania',          lang: 'de' },
  { prefix: '43',  country: 'Austria',           lang: 'de' },
  { prefix: '32',  country: 'Bélgica',           lang: 'fr' },
  { prefix: '34',  country: 'España',            lang: 'es' },
  { prefix: '33',  country: 'Francia',           lang: 'fr' },
  { prefix: '30',  country: 'Grecia',            lang: 'el' },
  { prefix: '39',  country: 'Italia',            lang: 'it' },
  { prefix: '31',  country: 'Países Bajos',      lang: 'nl' },
  { prefix: '1',   country: 'Estados Unidos',    lang: 'en' },
];

function detectCountry(phone) {
  // phone is already digits only (no +), e.g. "59898950206"
  for (const entry of COUNTRY_MAP) {
    if (phone.startsWith(entry.prefix)) {
      return { country: entry.country, lang: entry.lang };
    }
  }
  return { country: 'Unknown', lang: 'es' }; // default Spanish
}

// ---------------------------------------------------------------------------
// Bot name rotation (deterministic from phone hash)
// ---------------------------------------------------------------------------

const BOT_NAMES = ['Valeria', 'Luna', 'Sofía'];

function getBotName(phone) {
  let hash = 0;
  for (let i = 0; i < phone.length; i++) {
    hash = (hash * 31 + phone.charCodeAt(i)) >>> 0;
  }
  return BOT_NAMES[hash % BOT_NAMES.length];
}

// ---------------------------------------------------------------------------
// Business hours check (Uruguay UTC-3: 9am–10pm local = 12:00–01:00 UTC)
// ---------------------------------------------------------------------------

function isBusinessHours() {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMin  = now.getUTCMinutes();
  const totalUTCMinutes = utcHour * 60 + utcMin;
  // 12:00 UTC = 9:00 AM Uruguay  →  720 minutes
  // 01:00 UTC = 10:00 PM Uruguay →  60 minutes (next day)
  // So business window: 720 <= t < 1440 OR 0 <= t < 60
  return totalUTCMinutes >= 720 || totalUTCMinutes < 60;
}

// ---------------------------------------------------------------------------
// WhatsApp message sender
// ---------------------------------------------------------------------------

async function sendWAMessage(to, text) {
  try {
    const url = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[sendWAMessage] HTTP ${res.status} to ${to}: ${errBody}`);
    }
  } catch (err) {
    console.error(`[sendWAMessage] Error sending to ${to}:`, err.message);
  }
}

// ---------------------------------------------------------------------------
// System prompt builder
// ---------------------------------------------------------------------------

function buildSystemPrompt(botName, country, lang, isFirstMessage) {
  const landingUrl = process.env.LANDING_URL || 'https://powervita.vercel.app/';

  return `You are ${botName}, a warm and knowledgeable wellness advisor from the PowerVita team. You are a real human professional — never reveal or admit you are a bot or AI.

LANGUAGE RULE: Always respond in the EXACT same language the customer writes in. Never switch languages unless the customer does first.

IDENTITY RULES:
- You are ${botName}, a human wellness advisor. Never say you are an AI or bot.
- If asked once whether you are a bot/AI: explain you are an intelligent wellness assistant trained to help people — keep it warm and brief, then redirect to their health goals.
- If asked again insistently, or if the customer explicitly asks to speak with a real person or the owner: write a warm handoff message and include the exact tag [TRANSFER_TO_ANDRES] at the very end of your response. Do not use this tag in any other context.

PRICE RULE: Never give prices. Always direct customers to the website for prices and ordering: ${landingUrl}

PRIVACY NOTE: ${isFirstMessage ? 'On this first message only, include a brief privacy note (e.g. "Tu información es confidencial 🔒" in Spanish, adapted to the customer\'s language).' : 'Do NOT repeat the privacy note.'}

TONE: Warm, human, genuine, persuasive but never pushy. Use occasional emojis naturally. Sound like a caring friend who knows nutrition.

SOCIAL PROOF: When recommending products, naturally mention: "Miles de personas en ${country} ya están transformando su salud 💪" (adapt to customer's language and country).

---
CONVERSATION FLOW:
1. FIRST CONTACT: Greet warmly (use their name if you know it). Ask what their MAIN HEALTH OBJECTIVE is, offering these 6 options:
   - 🔥 Bajar de peso / Weight loss
   - 💪 Músculo / Deporte / Muscle & Sport
   - 🛡️ Inmunidad / Immunity
   - ✨ Anti-envejecimiento / Anti-aging
   - 🧠 Energía y enfoque / Energy & Focus
   - 😴 Estrés y sueño / Stress & Sleep
   - (or "Need guidance / Necesito orientación")

2. AFTER OBJECTIVE: Ask 1-2 specific follow-up questions to understand their situation better (e.g., age range, current habits, specific symptoms).

3. RECOMMENDATION: Recommend both the Starter Pack AND the Complete Pack for their objective, with brief product descriptions. Then direct to ${landingUrl} for prices and ordering.

---
FUXION PRODUCT CATALOG:

DETOX LINE:
- Prunex 1: Natural intestinal transit support, relieves constipation gently
- Flora Liv: Probiotic blend for gut microbiome balance
- Liquid Fibra: Digestive soluble/insoluble fiber blend
- Alpha Balance: Alkalizing green drink (spirulina, chlorella, wheatgrass) balances body pH
- Reset/Rexet: Liver detox effervescent tablet, supports hepatic cleansing
- Berry Balance: Cranberry-based, supports urinary tract health and reduces fluid retention

ENERGY LINE:
- Vita Xtra T+: Natural energizer with powerful antioxidants (acai, pomegranate, goji)
- Nutraday: Complete family multivitamin with minerals

PROTEIN LINE:
- Biopro+ Tect: Colostrum-based immunity booster and gut protector
- Biopro+ Fit: Protein formula designed for fat burning while preserving muscle
- Biopro+ Sport: High-performance protein for muscle growth and recovery
- Protein Active Fit / Sport / Tect: 100% plant-based protein alternatives (same benefits, vegan)

WEIGHT CONTROL LINE:
- Thermo T3: Thermogenic blend of 3 teas + L-carnitine for accelerated fat burning
- Nocarb-T: Carbohydrate blocker, reduces starch absorption
- Café & Café Fit: Green coffee with natural appetite suppressant
- Chocolate Fit: Functional hot chocolate with metabolism-boosting properties

IMMUNITY LINE:
- Vera+: Aloe vera + beta-glucans for respiratory and immune defense
- Gano Excel / Café Gano: Ganoderma mushroom (Reishi) for deep immune support and vitality

ANTI-AGING LINE:
- Youth Elixir: Resveratrol-based anti-aging formula, also improves sleep quality
- Beauty In: Collagen types I & IV for skin firmness, hair strength, nail health
- Golden Flx: Turmeric + ginger for joint flexibility and anti-inflammation
- Passion: Supports healthy circulation and sexual vitality

MENTAL VIGOR LINE:
- On: Taurine + GABA blend for sustained brain focus and mental clarity
- No Stress: Ashwagandha + magnesium for stress relief and nervous system calm

SPORT LINE:
- Pre Sport: Curcumin-based pre-workout for performance and reduced muscle damage
- Post Sport: BCAA + pomegranate for muscle recovery and reduced soreness
- Xpeed: Carbonated functional energy drink for training

---
RECOMMENDED PACKS BY OBJECTIVE:

🔥 WEIGHT LOSS:
  - Starter Pack (3 products): Prunex 1 + Thermo T3 + Nocarb-T
  - Complete Pack (5 products): + Liquid Fibra + Café Fit

💪 MUSCLE & SPORT:
  - Starter Pack: Biopro+ Sport + Pre Sport + Post Sport
  - Complete Pack: + Xpeed + Alpha Balance

🛡️ IMMUNITY:
  - Starter Pack: Vera+ + Biopro+ Tect + Alpha Balance
  - Complete Pack: + Berry Balance + Reset

✨ ANTI-AGING:
  - Starter Pack: Beauty In + Youth Elixir + Golden Flx
  - Complete Pack: + Passion + Berry Balance

🧠 ENERGY & FOCUS:
  - Starter Pack: On + Vita Xtra T+ + No Stress
  - Complete Pack: + Nutraday + Café & Café Fit

😴 STRESS & SLEEP:
  - Starter Pack: No Stress + Youth Elixir + Flora Liv
  - Complete Pack: + Vera+ + Golden Flx

---
Always end recommendations with a clear CTA directing to: ${landingUrl}
Keep responses concise, warm, and action-oriented.`;
}

// ---------------------------------------------------------------------------
// Core message processing
// ---------------------------------------------------------------------------

async function processMessage(phone, incomingText) {
  const supabase = await getSupabaseClient();
  const anthropic = await getAnthropicClient();

  // 1. Load or create conversation record
  let { data: conv, error: convErr } = await supabase
    .from('conversations')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (convErr) {
    console.error('[processMessage] DB select error:', convErr.message);
  }

  // Skip if already transferred to Andrés
  if (conv && conv.transferred) {
    console.log(`[processMessage] Skipping transferred conversation for ${phone}`);
    return;
  }

  const history = conv?.history || [];
  const retries  = conv?.retries  || 0;
  const isFirstMessage = history.length === 0;

  // Anti-loop: auto-transfer after 2 failed Anthropic calls
  if (retries >= 2) {
    console.warn(`[processMessage] Auto-transferring ${phone} after ${retries} retries`);
    await triggerTransfer(phone, supabase, '(auto — technical issue)', null, null);
    return;
  }

  // 2. Detect country / language / bot name
  const { country, lang } = detectCountry(phone);
  const botName = getBotName(phone);

  // 3. Upsert lead record
  const { data: existingLead } = await supabase
    .from('leads')
    .select('name, lang, country')
    .eq('phone', phone)
    .maybeSingle();

  await supabase.from('leads').upsert(
    {
      phone,
      country: existingLead?.country || country,
      lang:    existingLead?.lang    || lang,
      status:  'active',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'phone' }
  );

  const customerName = existingLead?.name || conv?.customer_name || null;

  // 4. Append new user message to history
  const updatedHistory = [
    ...history,
    { role: 'user', content: incomingText },
  ].slice(-20); // keep last 20

  // 5. Build messages for Claude (last 12)
  const messagesForClaude = updatedHistory.slice(-12);

  // 6. Call Claude
  let assistantText = null;
  let newRetries = retries;

  try {
    const systemPrompt = buildSystemPrompt(botName, country, lang, isFirstMessage);
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messagesForClaude,
    });
    assistantText = response.content[0]?.text || '';
    newRetries = 0; // reset on success
  } catch (err) {
    console.error('[processMessage] Anthropic error:', err.message);
    newRetries = retries + 1;

    // Persist incremented retry count and bail
    await supabase.from('conversations').upsert(
      {
        phone,
        history: updatedHistory,
        retries: newRetries,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'phone' }
    );

    // Fallback message to customer
    const fallback = lang === 'en'
      ? 'Sorry, I had a technical issue. Please try again in a moment!'
      : 'Lo siento, tuve un problema técnico. ¡Intenta de nuevo en un momento!';
    await sendWAMessage(phone, fallback);
    return;
  }

  // 7. Check for TRANSFER_TO_ANDRES tag
  const transferTag = '[TRANSFER_TO_ANDRES]';
  const needsTransfer = assistantText.includes(transferTag);
  const cleanText = assistantText.replace(transferTag, '').trim();

  // 8. Send response to customer
  await sendWAMessage(phone, cleanText);

  // 9. Append assistant message
  const finalHistory = [
    ...updatedHistory,
    { role: 'assistant', content: cleanText },
  ].slice(-20);

  // 10. Persist conversation
  await supabase.from('conversations').upsert(
    {
      phone,
      history: finalHistory,
      transferred: needsTransfer ? true : (conv?.transferred || false),
      retries: newRetries,
      last_message_at: new Date().toISOString(),
      bot_name: botName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'phone' }
  );

  // 11. Handle transfer if triggered
  if (needsTransfer) {
    await triggerTransfer(phone, supabase, cleanText, country, lang);
  }
}

// ---------------------------------------------------------------------------
// Transfer logic
// ---------------------------------------------------------------------------

async function triggerTransfer(phone, supabase, lastMessage, country, lang) {
  const ownerPhone = process.env.OWNER_PHONE;
  if (!ownerPhone) {
    console.warn('[triggerTransfer] OWNER_PHONE not set, skipping owner notification');
  }

  // Outside business hours message to customer
  if (!isBusinessHours()) {
    const outOfHoursMsg = lang === 'en'
      ? 'Andrés (our team lead) will reach out to you personally starting from 9:00 AM. Talk soon! 😊'
      : lang === 'pt'
        ? 'Andrés (nosso líder de equipe) entrará em contato com você a partir das 9h. Até logo! 😊'
        : 'Andrés (nuestro líder del equipo) te contactará personalmente a partir de las 9:00 AM. ¡Hasta pronto! 😊';
    await sendWAMessage(phone, outOfHoursMsg);
  }

  // Notify owner
  if (ownerPhone) {
    const { data: lead } = await supabase
      .from('leads')
      .select('name, country, lang')
      .eq('phone', phone)
      .maybeSingle();

    const summary =
      `🔔 *Nuevo contacto para seguimiento*\n` +
      `📱 Teléfono: +${phone}\n` +
      `👤 Nombre: ${lead?.name || 'Desconocido'}\n` +
      `🌍 País: ${lead?.country || country || 'Desconocido'}\n` +
      `💬 Último mensaje del bot: ${lastMessage ? lastMessage.substring(0, 200) : '(auto-transfer)'}\n` +
      `⏰ Hora: ${new Date().toLocaleString('es-UY', { timeZone: 'America/Montevideo' })}`;

    await sendWAMessage(ownerPhone, summary);
  }

  // Mark as transferred in DB
  await supabase.from('conversations').upsert(
    {
      phone,
      transferred: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'phone' }
  );

  // Update lead status
  await supabase.from('leads').upsert(
    {
      phone,
      status: 'transferred',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'phone' }
  );
}

// ---------------------------------------------------------------------------
// Main Vercel handler
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  // ------ GET: Webhook verification ------
  if (req.method === 'GET') {
    const mode      = req.query['hub.mode'];
    const token     = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
      console.log('[webhook] Verification successful');
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  // ------ POST: Incoming messages ------
  if (req.method === 'POST') {
    // Respond 200 immediately so WhatsApp doesn't retry
    res.status(200).end();

    try {
      const body = req.body;

      // Validate structure
      if (
        !body?.object ||
        !body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
      ) {
        // Could be a status update or other event — just ignore
        return;
      }

      const value   = body.entry[0].changes[0].value;
      const message = value.messages[0];

      // Only handle text messages
      if (message.type !== 'text') {
        console.log(`[webhook] Ignoring non-text message type: ${message.type}`);
        return;
      }

      const phone       = message.from; // digits only, no +
      const incomingText = message.text.body;

      console.log(`[webhook] Message from ${phone}: ${incomingText.substring(0, 80)}`);

      // Process asynchronously (response already sent)
      processMessage(phone, incomingText).catch((err) => {
        console.error(`[webhook] Unhandled error processing ${phone}:`, err.message);
      });
    } catch (err) {
      console.error('[webhook] POST parse error:', err.message);
    }

    return;
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
