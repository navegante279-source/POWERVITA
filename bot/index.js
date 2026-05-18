require("dotenv").config();
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const Anthropic = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── DATOS DE PRODUCTOS ────────────────────────────────────────────────────────
const PRODUCTS = [
  { name:"Reset",              line:"Detox",   emoji:"🌿", tag:"Reinicia tu cuerpo",     desc:"Bebida efervescente que desintoxica y protege el hígado frente al exceso de alcohol o comidas grasosas.", benefits:["Desintoxica el hígado","Elimina toxinas","Reactiva el metabolismo"], ing:"Tuna roja · Alcachofa · Hierba luisa · Clorofila · Zinc" },
  { name:"Liquid Fibra",       line:"Detox",   emoji:"🍋", tag:"Digestión puntual",      desc:"Fibra prebiótica soluble que regula el ritmo digestivo y reduce la absorción de grasas.", benefits:["Regula la digestión","Nutre la flora intestinal","Reduce absorción de grasas"], ing:"Inulina · Oligofructuosa · Raíz de achicoria" },
  { name:"Flora Liv",          line:"Detox",   emoji:"🫧", tag:"Protege desde adentro",   desc:"Miles de millones de bacterias probióticas vivas para regenerar la microbiota y frenar la acidez.", benefits:["Regenera la microbiota","Optimiza la digestión","Frena la acidez"], ing:"Cultivos probióticos · Fibra prebiótica · Granadilla · Aguaymanto" },
  { name:"Alpha Balance",      line:"Detox",   emoji:"🥬", tag:"Cuerpo alcalino",         desc:"Concentrado verde con clorofila, alfalfa y espirulina para alcalinizar la sangre y eliminar metales pesados.", benefits:["Alcaliniza el organismo","Purifica la sangre","Elimina metales pesados"], ing:"Clorofila · Alfalfa · Espirulina · Chlorella · Pasto de trigo" },
  { name:"Prunex",             line:"Detox",   emoji:"🫐", tag:"Limpieza natural",        desc:"Concentrado de ciruela y prebióticos para regular el tránsito intestinal y limpiar el colon.", benefits:["Regula el tránsito intestinal","Limpia el colon naturalmente","Reduce la hinchazón"], ing:"Ciruela pasa · Prebióticos · Enzimas digestivas · Magnesio" },
  { name:"Nutraday",           line:"Energy",  emoji:"⚡", tag:"Vitalidad familiar",      desc:"Bebida multivitamínica con moringa, camu camu y quinua germinada. Ideal para toda la familia.", benefits:["12 vitaminas + 5 minerales","Fortalece las defensas","Desarrollo integral"], ing:"Moringa · Guayaba · Camu Camu · Açaí · Quinua germinada" },
  { name:"Vita Xtra T+",      line:"Energy",  emoji:"🌟", tag:"Elimina la fatiga",       desc:"Energizante concentrado con guayusa, ginseng y micelio de cordyceps para eliminar la fatiga física y mental.", benefits:["Energía sostenida todo el día","Alto poder antioxidante","Elimina fatiga física y mental"], ing:"Guayusa · Ginseng · Cordyceps · Açaí · Maca" },
  { name:"Xpeed",              line:"Energy",  emoji:"🚀", tag:"Energía inmediata",       desc:"Bebida gasificada energizante lista para consumir, diseñada para elevar el estado de alerta físico inmediato.", benefits:["Energía inmediata","Eleva el estado de alerta","Sin caídas de energía"], ing:"Maca · Guaraná · Taurina vegetal · Vitamina C" },
  { name:"Biopro+ Tect",      line:"Protein", emoji:"🛡️", tag:"Activa tus defensas",    desc:"Proteína animal con bioferrina (patente láctea) formulada para elevar defensas inmunitarias en toda la familia.", benefits:["Eleva defensas inmunitarias","Regeneración celular","Fortalece huesos"], ing:"Bioferrina · Colostrum® · Aminoácidos esenciales · DHA" },
  { name:"Protein Active Fit", line:"Protein", emoji:"💪", tag:"Nutrición vegetal",       desc:"Proteína 100% vegetal de quinua germinada y arroz. Sin lactosa ni alérgenos. Controla el apetito y la grasa.", benefits:["100% vegetal y sin lactosa","Acelera pérdida de grasa","Mantiene el músculo firme"], ing:"Quinua germinada · Arroz integral · Algas · DHA" },
  { name:"No Stress",          line:"Immunity",emoji:"🧘", tag:"Equilibrio mental",       desc:"Té herbal relajante con ashwagandha y manzanilla que apaga el estrés y relaja la mente sin inducir sueño diurno.", benefits:["Reduce el estrés","Calma la irritabilidad","Claridad mental sin somnolencia"], ing:"Ashwagandha · Manzanilla · Vitaminas B · Minerales" },
  { name:"Youth Elixir",       line:"Immunity",emoji:"✨", tag:"Activa tu juventud",      desc:"Fórmula con resveratrol y aminoácidos para retrasar el envejecimiento celular y mejorar el sueño profundo.", benefits:["Anti-envejecimiento celular","Mejora el sueño profundo","Vitalidad juvenil"], ing:"Resveratrol · Aminoácidos · Vitaminas · Extractos premium" },
  { name:"Pre Sport",          line:"Sport",   emoji:"🏃", tag:"Rendimiento máximo",      desc:"Bebida isotónica con curcumina y creatina que dilata los vasos sanguíneos y da energía explosiva antes del ejercicio.", benefits:["Energía explosiva","Mayor resistencia","Enfoque y concentración"], ing:"Curcumina · Creatina · Aminoácidos · Cafeína natural" },
  { name:"Thermo T3",          line:"Control", emoji:"🔥", tag:"Activa tu metabolismo",   desc:"Infusión de tres tés y carnitina que acelera la termogénesis para transformar la grasa corporal en energía.", benefits:["Activa la termogénesis","Quema grasa naturalmente","Control de peso efectivo"], ing:"Té verde · Té negro · Té rojo · Carnitina · Jengibre" },
];

const COUNTRIES_INFO = {
  "Uruguay":         { flag:"🇺🇾", currency:"UYU", shipping:"Envío express 24-48hs",        popular:["Prunex","Vita Xtra T+","Thermo T3"] },
  "Argentina":       { flag:"🇦🇷", currency:"ARS", shipping:"Envío 3-5 días hábiles",       popular:["Nutraday","No Stress","Reset"] },
  "Colombia":        { flag:"🇨🇴", currency:"COP", shipping:"Envío nacional 2-4 días",      popular:["Vita Xtra T+","Protein Active Fit","Flora Liv"] },
  "México":          { flag:"🇲🇽", currency:"MXN", shipping:"Envío 3-5 días hábiles",       popular:["Reset","Thermo T3","Nutraday"] },
  "España":          { flag:"🇪🇸", currency:"EUR", shipping:"Envío 5-7 días hábiles",       popular:["Vita Xtra T+","No Stress","Youth Elixir"] },
  "Brasil":          { flag:"🇧🇷", currency:"BRL", shipping:"Frete em 5-7 dias úteis",      popular:["Nutraday","Biopro+ Tect","Reset"] },
  "Chile":           { flag:"🇨🇱", currency:"CLP", shipping:"Envío 2-4 días hábiles",       popular:["Thermo T3","Vita Xtra T+","Flora Liv"] },
  "Perú":            { flag:"🇵🇪", currency:"PEN", shipping:"Envío 3-5 días hábiles",       popular:["Reset","Nutraday","No Stress"] },
  "Estados Unidos":  { flag:"🇺🇸", currency:"USD", shipping:"Shipping 5-7 business days",   popular:["Vita Xtra T+","Protein Active Fit","Biopro+ Tect"] },
};

const PACKS = [
  { name:"Starter Pack",  emoji:"🌱", desc:"Ideal para comenzar. 1-2 productos base.", price:"Desde $49 USD" },
  { name:"Transform Kit", emoji:"⚡", desc:"Transformación completa en 60-90 días. 3-4 productos.", price:"Desde $119 USD" },
  { name:"Elite Program", emoji:"👑", desc:"Protocolo premium de 90 días + soporte personalizado.", price:"Desde $249 USD" },
];

// ── SISTEMA PROMPT ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Eres el asistente virtual oficial de POWERVITA FuXion, llamado "Vita Advisor".
Representas una empresa de nutrición biotecnológica con presencia en 37 países.

PRODUCTOS DISPONIBLES (14 en total):
${PRODUCTS.map(p => `- ${p.emoji} ${p.name} (Línea ${p.line}): ${p.desc} Ingredientes: ${p.ing}. Beneficios: ${p.benefits.join(", ")}.`).join("\n")}

PACKS DISPONIBLES:
${PACKS.map(p => `- ${p.emoji} ${p.name}: ${p.desc} ${p.price}`).join("\n")}

DISPONIBILIDAD POR PAÍS:
${Object.entries(COUNTRIES_INFO).map(([c,d]) => `- ${d.flag} ${c}: Envío: ${d.shipping}. Populares: ${d.popular.join(", ")}.`).join("\n")}

REGLAS DE COMPORTAMIENTO:
1. Responde SIEMPRE en español, de forma cálida, profesional y entusiasta.
2. Mensajes CORTOS y directos (máx 3-4 párrafos). WhatsApp es informal.
3. Usa emojis con moderación para dar calidez.
4. Cuando recomiendes productos, menciona máx 2-3 y explica POR QUÉ se adaptan al caso.
5. Siempre termina con una pregunta o un CTA (llamado a la acción).
6. Para compras o consultas específicas de precio, invita a hablar con el asesor humano.
7. No inventes precios exactos. Menciona rangos o dirigí al asesor.
8. El link de inscripción es: https://ifuxion.com/andresvarela/enrollment/chooseperson
9. Sé empático cuando alguien describe síntomas de salud. Recomienda siempre consultar un médico además de los productos.`;

// ── ESTADO DE CONVERSACIONES ──────────────────────────────────────────────────
const conversations = new Map(); // chatId -> { history, state, leadData }
const LEAD_CAPTURE_STEPS = ["name", "country", "interest", "phone"];

function getConversation(chatId) {
  if (!conversations.has(chatId)) {
    conversations.set(chatId, {
      history: [],
      state: "menu",
      leadData: {},
      leadStep: 0,
    });
  }
  return conversations.get(chatId);
}

// ── MENÚ PRINCIPAL ────────────────────────────────────────────────────────────
function mainMenu() {
  return `🌿 *POWERVITA FuXion* — Vita Advisor IA

Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?

1️⃣  Ver catálogo de productos
2️⃣  Analizar mis síntomas (IA te recomienda)
3️⃣  Plan nutricional personalizado
4️⃣  Info sobre el negocio / ROI
5️⃣  Hablar con un asesor humano

Respondé el *número* o escribime directamente tu consulta. 💬`;
}

function productCatalog() {
  const lines = {};
  PRODUCTS.forEach(p => {
    if (!lines[p.line]) lines[p.line] = [];
    lines[p.line].push(`${p.emoji} *${p.name}* — _${p.tag}_`);
  });
  let text = "📦 *Catálogo FuXion*\n\n";
  for (const [line, prods] of Object.entries(lines)) {
    text += `━━ *Línea ${line.toUpperCase()}* ━━\n`;
    text += prods.join("\n") + "\n\n";
  }
  text += "Escribime el nombre de cualquier producto para ver detalles 👆\nor respondé con el número de opción del menú.";
  return text;
}

function productDetail(product) {
  return `${product.emoji} *${product.name}*
_Línea ${product.line} — ${product.tag}_

📝 ${product.desc}

✅ *Beneficios:*
${product.benefits.map(b => `• ${b}`).join("\n")}

🌱 *Ingredientes:*
${product.ing}

¿Querés saber si este producto es ideal para vos? Escribime tus síntomas o consultá con nuestro asesor. 💬`;
}

// ── LLAMADA A CLAUDE ──────────────────────────────────────────────────────────
async function askClaude(conv, userMessage) {
  conv.history.push({ role: "user", content: userMessage });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: conv.history,
  });

  const reply = response.content[0].text;
  conv.history.push({ role: "assistant", content: reply });

  // Limitar historial para no exceder tokens (últimas 20 interacciones)
  if (conv.history.length > 20) {
    conv.history = conv.history.slice(-20);
  }

  return reply;
}

// ── ANÁLISIS DE SÍNTOMAS VÍA IA ───────────────────────────────────────────────
async function analyzeSymptoms(conv, symptoms) {
  const prompt = `El usuario describió estos síntomas/necesidades: "${symptoms}"

Analizá y recomendá de la lista de productos FuXion disponibles. Respondé en formato WhatsApp (sin markdown complejo):
- Diagnóstico breve (1 oración)
- 2-3 productos recomendados con emoji, nombre y por qué lo recomendás
- Mensaje motivador al final
- Pregunta de cierre para avanzar con la compra`;

  return await askClaude(conv, prompt);
}

// ── PLAN NUTRICIONAL VÍA IA ───────────────────────────────────────────────────
async function generateNutriPlan(conv, data) {
  const prompt = `Creá un plan nutricional personalizado para WhatsApp con esta info:
Objetivo: ${data.goal || "bienestar general"}
Síntomas: ${data.symptoms || "ninguno especificado"}
Edad: ${data.age || "no indicada"} años
País: ${data.country || "no indicado"}

Respondé en formato WhatsApp simple:
- Título del plan
- 2-3 productos FuXion recomendados con horario de consumo
- 3 tips nutricionales prácticos
- Duración sugerida
- CTA para cerrar la venta`;

  return await askClaude(conv, prompt);
}

// ── ROI / NEGOCIO VÍA IA ──────────────────────────────────────────────────────
async function generateROI(conv, data) {
  const prompt = `Alguien interesado en el negocio FuXion desde ${data.country || "Latinoamérica"} preguntó sobre ingresos.
Horas disponibles por semana: ${data.hours || "no especificadas"}
Experiencia en ventas: ${data.experience || "sin experiencia"}

Respondé de forma motivadora en WhatsApp:
- Descripción del modelo de negocio FuXion (distribución directa, 37 países)
- Proyección de ingresos en 3 etapas (mes 1-3 / mes 4-6 / mes 7-12) con rangos reales
- 3 ventajas clave del negocio
- CTA para registrarse: https://ifuxion.com/andresvarela/enrollment/chooseperson`;

  return await askClaude(conv, prompt);
}

// ── CAPTURA DE LEAD ───────────────────────────────────────────────────────────
function leadQuestion(step) {
  const questions = {
    name:     "📝 Para enviarte información personalizada, ¿cuál es tu nombre?",
    country:  "🌎 ¿Desde qué país nos escribís?",
    interest: "🎯 ¿Qué te interesa más?\n1. Mejorar mi salud\n2. Perder peso\n3. Más energía\n4. El negocio FuXion\n\nRespondé el número o describilo con tus palabras.",
    phone:    "📱 ¿Cuál es tu número de teléfono? (para que un asesor se contacte contigo)",
  };
  return questions[LEAD_CAPTURE_STEPS[step]];
}

async function notifyLead(client, leadData, fromNumber) {
  const leadsNumber = process.env.WA_LEADS_NUMBER;
  if (!leadsNumber) return;

  const msg = `🔔 *NUEVO LEAD — POWERVITA*

👤 Nombre: ${leadData.name || "No indicado"}
🌎 País: ${leadData.country || "No indicado"}
🎯 Interés: ${leadData.interest || "No indicado"}
📱 Teléfono: ${leadData.phone || fromNumber}
📞 WhatsApp: wa.me/${fromNumber.replace("@c.us", "")}

_Lead captado automáticamente por Vita Advisor Bot_ 🌿`;

  try {
    await client.sendMessage(`${leadsNumber}@c.us`, msg);
  } catch (e) {
    console.error("Error al notificar lead:", e.message);
  }
}

// ── ENCONTRAR PRODUCTO POR NOMBRE ─────────────────────────────────────────────
function findProduct(text) {
  const t = text.toLowerCase();
  return PRODUCTS.find(p =>
    t.includes(p.name.toLowerCase()) ||
    t.includes(p.name.toLowerCase().replace(" ", ""))
  );
}

// ── MANEJADOR PRINCIPAL DE MENSAJES ──────────────────────────────────────────
async function handleMessage(client, msg) {
  const chatId = msg.from;
  const text = msg.body.trim();
  const conv = getConversation(chatId);

  // Ignorar mensajes de grupos y estados
  if (msg.from.includes("@g.us") || msg.from === "status@broadcast") return;

  let reply = "";

  try {
    // ── CAPTURA DE LEAD activa ──────────────────────────────────────────────
    if (conv.state === "lead_capture") {
      const step = LEAD_CAPTURE_STEPS[conv.leadStep];
      conv.leadData[step] = text;
      conv.leadStep++;

      if (conv.leadStep < LEAD_CAPTURE_STEPS.length) {
        reply = leadQuestion(conv.leadStep);
      } else {
        await notifyLead(client, conv.leadData, chatId);
        conv.state = "menu";
        conv.leadStep = 0;
        reply = `✅ ¡Perfecto, ${conv.leadData.name}!

Recibimos tus datos. Un asesor de POWERVITA se va a contactar contigo muy pronto. 🌿

Mientras tanto, podés explorar nuestro catálogo en:\n👉 https://powervita.vercel.app

${mainMenu()}`;
      }

      await client.sendMessage(chatId, reply);
      return;
    }

    // ── ESTADO: esperar síntomas ────────────────────────────────────────────
    if (conv.state === "awaiting_symptoms") {
      conv.state = "menu";
      await client.sendMessage(chatId, "🔬 _Analizando con IA..._");
      reply = await analyzeSymptoms(conv, text);
      await client.sendMessage(chatId, reply);
      return;
    }

    // ── ESTADO: esperar datos de plan nutricional ───────────────────────────
    if (conv.state === "awaiting_nutri") {
      conv.state = "menu";
      const planData = {};
      if (text.includes("bajar") || text.includes("peso")) planData.goal = "bajar de peso";
      else if (text.includes("energía") || text.includes("energia")) planData.goal = "más energía";
      else if (text.includes("músculo") || text.includes("musculo")) planData.goal = "ganar músculo";
      else if (text.includes("detox") || text.includes("desintox")) planData.goal = "detox y depuración";
      else planData.goal = text;
      await client.sendMessage(chatId, "🥗 _Generando tu plan con IA..._");
      reply = await generateNutriPlan(conv, planData);
      await client.sendMessage(chatId, reply);
      return;
    }

    // ── ESTADO: esperar datos de ROI ────────────────────────────────────────
    if (conv.state === "awaiting_roi") {
      conv.state = "menu";
      await client.sendMessage(chatId, "💰 _Calculando proyección con IA..._");
      reply = await generateROI(conv, { country: text });
      await client.sendMessage(chatId, reply);
      return;
    }

    // ── OPCIONES DEL MENÚ ───────────────────────────────────────────────────
    if (text === "1" || /cat[aá]logo|productos/i.test(text)) {
      reply = productCatalog();

    } else if (text === "2" || /s[ií]ntoma|analizar|anal[ií]sis|me siento|me duele|tengo/i.test(text)) {
      conv.state = "awaiting_symptoms";
      reply = `🔬 *Analizador de Síntomas IA*

Contame cómo te sentís. Podés describir:
• Síntomas físicos (cansancio, inflamación, peso, etc.)
• Tu objetivo de salud
• Tu estilo de vida

Escribilo con tus palabras y la IA te recomendará los productos ideales. 👇`;

    } else if (text === "3" || /plan|nutri|dieta|alimentaci/i.test(text)) {
      conv.state = "awaiting_nutri";
      reply = `🥗 *Plan Nutricional Personalizado IA*

Contame cuál es tu objetivo principal:
• 🔥 Bajar de peso
• ⚡ Más energía
• 💪 Ganar músculo
• 🌿 Detox / depuración
• 🧘 Bienestar general

Escribilo con tus palabras 👇`;

    } else if (text === "4" || /negocio|roi|ingreso|ganar|emprender|distribuidor|socio/i.test(text)) {
      conv.state = "awaiting_roi";
      reply = `💰 *Oportunidad de Negocio FuXion*

¿Desde qué país te interesa emprender? Escribí tu país y te genero una proyección de ingresos personalizada con IA. 🌎

_(Ej: Argentina, México, Colombia, España...)_`;

    } else if (text === "5" || /asesor|humano|persona|contacto|llamar|hablar/i.test(text)) {
      conv.state = "lead_capture";
      conv.leadStep = 0;
      conv.leadData = {};
      reply = `👋 ¡Con gusto te conectamos con un asesor!

Primero necesito algunos datos rápidos para que el asesor pueda ayudarte mejor.

${leadQuestion(0)}`;

    } else if (/^(hola|buenas|buenos|buen|hi|hello|ola|ey|hey)/i.test(text) || text === "menu" || text === "menú" || text === "inicio" || text === "start") {
      reply = mainMenu();

    } else {
      // Buscar si menciona un producto específico
      const prod = findProduct(text);
      if (prod) {
        reply = productDetail(prod);
      } else {
        // Chat libre con IA (Vita Advisor)
        reply = await askClaude(conv, text);
      }
    }

    if (reply) {
      await client.sendMessage(chatId, reply);
    }

  } catch (error) {
    console.error("Error procesando mensaje:", error.message);
    await client.sendMessage(
      chatId,
      "❌ Hubo un inconveniente. Por favor escribí *menú* para reiniciar o contactá a nuestro asesor directo. 🌿"
    );
  }
}

// ── INICIALIZAR CLIENTE WHATSAPP ──────────────────────────────────────────────
const client = new Client({
  authStrategy: new LocalAuth({ clientId: "powervita-bot" }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  },
});

client.on("qr", (qr) => {
  console.log("\n📱 Escaneá este QR con tu WhatsApp para conectar el bot:\n");
  qrcode.generate(qr, { small: true });
  console.log("\n⏳ Esperando escaneo...\n");
});

client.on("ready", () => {
  console.log("✅ ¡POWERVITA Bot conectado y listo!");
  console.log("🌿 Vita Advisor IA está activo en WhatsApp\n");
});

client.on("authenticated", () => {
  console.log("🔐 Sesión autenticada correctamente.");
});

client.on("auth_failure", (msg) => {
  console.error("❌ Error de autenticación:", msg);
});

client.on("disconnected", (reason) => {
  console.log("⚠️  Bot desconectado:", reason);
  console.log("Reiniciando en 5 segundos...");
  setTimeout(() => client.initialize(), 5000);
});

client.on("message", async (msg) => {
  await handleMessage(client, msg);
});

client.initialize();
