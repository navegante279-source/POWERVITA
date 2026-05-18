/**
 * Follow-up cron job — runs every hour via Vercel Cron
 * Sends a warm 24h follow-up message to engaged contacts who haven't heard back.
 *
 * Required environment variables:
 *   WHATSAPP_TOKEN     - Meta WhatsApp Cloud API Bearer token
 *   WHATSAPP_PHONE_ID  - Phone Number ID from Meta dashboard
 *   SUPABASE_URL       - Supabase project URL
 *   SUPABASE_KEY       - Supabase service role key (secret)
 *   LANDING_URL        - https://powervita.vercel.app/
 *
 * Note: requires the followup_sent_at column — run api/db-migration.sql first.
 */

// ---------------------------------------------------------------------------
// Lazy Supabase client
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

// ---------------------------------------------------------------------------
// WhatsApp sender (same pattern as whatsapp.js)
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
      console.error(`[followup/sendWAMessage] HTTP ${res.status} to ${to}: ${errBody}`);
    }
  } catch (err) {
    console.error(`[followup/sendWAMessage] Error sending to ${to}:`, err.message);
  }
}

// ---------------------------------------------------------------------------
// Follow-up message templates by language
// ---------------------------------------------------------------------------

function buildFollowUpMessage(lang, botName, landingUrl) {
  switch (lang) {
    case 'pt':
      return (
        `Oi! Sou ${botName} da equipe PowerVita 😊\n\n` +
        `Só queria saber se você teve a chance de ver as informações que compartilhei. ` +
        `Muitas pessoas aqui já estão sentindo os resultados!\n\n` +
        `Se tiver alguma dúvida ou quiser saber mais, estou aqui. ` +
        `Você também pode conferir tudo em: ${landingUrl} 🌿`
      );
    case 'en':
      return (
        `Hey! This is ${botName} from the PowerVita team 😊\n\n` +
        `Just checking in — did you get a chance to look at the info I shared? ` +
        `So many people are already feeling amazing results!\n\n` +
        `Feel free to reach out if you have any questions. ` +
        `You can also find everything here: ${landingUrl} 🌿`
      );
    case 'fr':
      return (
        `Bonjour ! C'est ${botName} de l'équipe PowerVita 😊\n\n` +
        `Je voulais juste savoir si vous avez eu l'occasion de regarder les informations que j'avais partagées. ` +
        `Beaucoup de personnes obtiennent déjà des résultats incroyables !\n\n` +
        `N'hésitez pas si vous avez des questions. ` +
        `Retrouvez tout ici : ${landingUrl} 🌿`
      );
    case 'de':
      return (
        `Hallo! Hier ist ${botName} vom PowerVita-Team 😊\n\n` +
        `Ich wollte nur nachfragen, ob Sie die Informationen, die ich geteilt habe, durchschauen konnten. ` +
        `Viele Menschen erzielen bereits tolle Ergebnisse!\n\n` +
        `Bei Fragen bin ich gerne für Sie da. ` +
        `Alles Weitere finden Sie hier: ${landingUrl} 🌿`
      );
    default: // 'es' and everything else
      return (
        `¡Hola! Soy ${botName} del equipo PowerVita 😊\n\n` +
        `Solo quería saber si tuviste la oportunidad de ver la información que compartí. ` +
        `¡Mucha gente ya está experimentando resultados increíbles!\n\n` +
        `Si tienes alguna pregunta o quieres saber más, aquí estoy. ` +
        `También puedes verlo todo en: ${landingUrl} 🌿`
      );
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  // Only allow GET (Vercel Cron uses GET) or POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Optional: restrict to Vercel Cron calls
  // The x-vercel-cron header is set by Vercel when invoking cron jobs.
  // Remove or comment out the check below if you want to trigger manually.
  // const isCron = req.headers['x-vercel-cron'] === '1';
  // if (!isCron) return res.status(401).json({ error: 'Unauthorized' });

  const landingUrl = process.env.LANDING_URL || 'https://powervita.vercel.app/';

  try {
    const supabase = await getSupabaseClient();

    // Query conversations eligible for follow-up:
    //   - not transferred
    //   - last message > 23 hours ago
    //   - engaged (history has > 2 messages)
    //   - follow-up not yet sent
    const cutoff = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('phone, history, bot_name, customer_name')
      .eq('transferred', false)
      .lt('last_message_at', cutoff)
      .is('followup_sent_at', null);

    if (error) {
      console.error('[followup] DB query error:', error.message);
      return res.status(500).json({ error: 'DB query failed' });
    }

    if (!conversations || conversations.length === 0) {
      console.log('[followup] No eligible conversations found.');
      return res.status(200).json({ processed: 0 });
    }

    // Filter to only engaged conversations (history length > 2)
    const eligible = conversations.filter(
      (c) => Array.isArray(c.history) && c.history.length > 2
    );

    console.log(`[followup] Processing ${eligible.length} follow-ups`);

    let successCount = 0;
    const now = new Date().toISOString();

    for (const conv of eligible) {
      try {
        // Get language from leads table
        const { data: lead } = await supabase
          .from('leads')
          .select('lang, name')
          .eq('phone', conv.phone)
          .maybeSingle();

        const lang    = lead?.lang    || 'es';
        const botName = conv.bot_name || 'Valeria';
        const message = buildFollowUpMessage(lang, botName, landingUrl);

        await sendWAMessage(conv.phone, message);

        // Mark follow-up as sent
        await supabase
          .from('conversations')
          .update({ followup_sent_at: now, updated_at: now })
          .eq('phone', conv.phone);

        console.log(`[followup] Sent to ${conv.phone}`);
        successCount++;
      } catch (err) {
        console.error(`[followup] Error processing ${conv.phone}:`, err.message);
      }
    }

    return res.status(200).json({ processed: successCount, total: eligible.length });
  } catch (err) {
    console.error('[followup] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Unexpected error', message: err.message });
  }
}
