import crypto from "node:crypto";

// Agenda de Serenity Holistic Spa sobre Google Calendar.
// El calendario del spa ES la base de datos: cada reserva es un evento, y
// cualquier otro evento que el equipo agende a mano también ocupa el horario.
//
// Variables de entorno (Vercel):
//   GOOGLE_SERVICE_ACCOUNT_EMAIL  email de la cuenta de servicio
//   GOOGLE_PRIVATE_KEY            clave privada de la cuenta de servicio (con \n)
//   SERENITY_CALENDAR_ID          ID del calendario del spa (compartido con la cuenta de servicio)
//   SERENITY_ADMIN_CODE           código de "Acceso equipo"

const TZ = "America/Montevideo";
const TZ_OFFSET = "-03:00"; // Uruguay no usa horario de verano desde 2015
const SLOT_HOURS = 2;
const MAX_DAYS_AHEAD = 92;
const SPA_ADDRESS = "Dr. José Scosería 2856, Montevideo, Uruguay";
const SERVICES = [
  "Jade", "Amatista", "Mimo al alma", "Cuarzo Rosa",
  "Jade Dúo (en pareja)", "Esmeralda (en pareja)", "Cuarzo Rosa Dúo (en pareja)"
];

// Martes a viernes 9 a 19 hs, sábados 9 a 14 hs. Domingos y lunes, cerrado.
function hoursForDate(dateStr) {
  const day = new Date(dateStr + "T12:00:00Z").getUTCDay();
  if (day === 0 || day === 1) return [];
  if (day === 6) return ["09:00", "11:00"];
  return ["09:00", "11:00", "13:00", "15:00", "17:00"];
}

function slotStart(date, time) { return new Date(`${date}T${time}:00${TZ_OFFSET}`); }
function slotEnd(date, time) { return new Date(slotStart(date, time).getTime() + SLOT_HOURS * 3600e3); }
function isoLocal(d) {
  // Fecha/hora de Montevideo con offset explícito, como la espera Google Calendar.
  const m = new Date(d.getTime() - 3 * 3600e3);
  return m.toISOString().slice(0, 19) + TZ_OFFSET;
}
function todayUY() { return new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10); }
function addDays(dateStr, n) {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// --- Google auth (cuenta de servicio, JWT firmado con RS256) ---
let cachedToken = null;
async function getAccessToken() {
  if (cachedToken && cachedToken.exp > Date.now() + 60e3) return cachedToken.value;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = b64({ alg: "RS256", typ: "JWT" }) + "." + b64({
    iss: email,
    scope: "https://www.googleapis.com/auth/calendar.events",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  });
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(key, "base64url");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: unsigned + "." + signature
    })
  });
  const data = await r.json();
  if (!r.ok) throw new Error("Google auth: " + (data.error_description || data.error || r.status));
  cachedToken = { value: data.access_token, exp: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

async function gcal(path, { method = "GET", body, query } = {}) {
  const token = await getAccessToken();
  const cal = encodeURIComponent(process.env.SERENITY_CALENDAR_ID);
  const qs = query ? "?" + new URLSearchParams(query) : "";
  const r = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${cal}/events${path}${qs}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  if (r.status === 204) return null;
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("Google Calendar: " + (data.error?.message || r.status));
  return data;
}

async function listEvents(fromDate, toDateExclusive) {
  const items = [];
  let pageToken;
  do {
    const data = await gcal("", {
      query: {
        timeMin: slotStart(fromDate, "00:00").toISOString(),
        timeMax: slotStart(toDateExclusive, "00:00").toISOString(),
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "2500",
        ...(pageToken ? { pageToken } : {})
      }
    });
    items.push(...(data.items || []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  // Eventos marcados como "Disponible" en Google Calendar no ocupan horario.
  return items.filter((e) => e.status !== "cancelled" && e.transparency !== "transparent");
}

function eventRange(e) {
  const start = e.start.dateTime ? new Date(e.start.dateTime) : new Date(`${e.start.date}T00:00:00${TZ_OFFSET}`);
  const end = e.end.dateTime ? new Date(e.end.dateTime) : new Date(`${e.end.date}T00:00:00${TZ_OFFSET}`);
  return { start, end };
}
function overlaps(e, date, time) {
  const { start, end } = eventRange(e);
  return start < slotEnd(date, time) && end > slotStart(date, time);
}
function kind(e) { return e.extendedProperties?.private?.serenity || "other"; }

function busySlots(events, fromDate, toDateExclusive) {
  const busy = [];
  for (let d = fromDate; d < toDateExclusive; d = addDays(d, 1)) {
    for (const t of hoursForDate(d)) {
      if (events.some((e) => overlaps(e, d, t))) busy.push(`${d} ${t}`);
    }
  }
  return busy;
}

function toBooking(e) {
  const p = e.extendedProperties.private;
  const { start } = eventRange(e);
  const local = isoLocal(start);
  return { id: e.id, date: local.slice(0, 10), time: local.slice(11, 16), service: p.service, name: p.name, contact: p.contact };
}

function isAdmin(code) {
  const expected = process.env.SERENITY_ADMIN_CODE || "";
  if (!expected || typeof code !== "string") return false;
  const h = (s) => crypto.createHash("sha256").update(s).digest();
  return crypto.timingSafeEqual(h(code), h(expected));
}

function validSlot(date, time) {
  if (!DATE_RE.test(date || "") || !hoursForDate(date).includes(time)) return false;
  if (slotStart(date, time).getTime() < Date.now()) return false;
  return date <= addDays(todayUY(), MAX_DAYS_AHEAD);
}

// Inserta un evento en un horario y resuelve carreras: si otra reserva entró
// al mismo tiempo, gana la creada primero y la otra se borra.
async function insertExclusive(date, time, body) {
  const day = date, next = addDays(date, 1);
  const before = await listEvents(day, next);
  if (before.some((e) => overlaps(e, date, time))) return null;
  const created = await gcal("", { method: "POST", body: {
    ...body,
    start: { dateTime: isoLocal(slotStart(date, time)), timeZone: TZ },
    end: { dateTime: isoLocal(slotEnd(date, time)), timeZone: TZ }
  } });
  const after = await listEvents(day, next);
  const rivals = after.filter((e) => e.id !== created.id && overlaps(e, date, time));
  const lost = rivals.some((e) => e.created < created.created || (e.created === created.created && e.id < created.id));
  if (lost) {
    await gcal("/" + encodeURIComponent(created.id), { method: "DELETE" });
    return null;
  }
  return created;
}

async function adminList() {
  const from = todayUY(), to = addDays(from, MAX_DAYS_AHEAD + 1);
  const events = await listEvents(from, to);
  const upcoming = events.filter((e) => eventRange(e).end.getTime() > Date.now());
  return {
    bookings: upcoming.filter((e) => kind(e) === "booking").map(toBooking),
    blocked: upcoming.filter((e) => kind(e) === "blocked").map((e) => {
      const local = isoLocal(eventRange(e).start);
      return { id: e.id, date: local.slice(0, 10), time: local.slice(11, 16) };
    })
  };
}

const clean = (s, max) => String(s || "").replace(/\s+/g, " ").trim().slice(0, max);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const missing = ["GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_PRIVATE_KEY", "SERENITY_CALENDAR_ID", "SERENITY_ADMIN_CODE"]
    .filter((k) => !process.env[k]);
  if (missing.length) return res.status(500).json({ error: "Faltan variables en Vercel: " + missing.join(", ") });

  try {
    if (req.method === "GET") {
      // Disponibilidad pública: solo horarios ocupados, sin datos de clientas.
      const from = DATE_RE.test(req.query.from || "") ? req.query.from : todayUY();
      let to = DATE_RE.test(req.query.to || "") ? req.query.to : addDays(from, 70);
      if (to > addDays(from, MAX_DAYS_AHEAD + 31)) to = addDays(from, MAX_DAYS_AHEAD + 31);
      const events = await listEvents(from, to);
      return res.status(200).json({ ok: true, busy: busySlots(events, from, to) });
    }
    if (req.method !== "POST") return res.status(405).end();

    const b = req.body || {};
    if (b.action === "book") {
      const name = clean(b.name, 80), contact = clean(b.contact, 40);
      if (!name || !contact) return res.status(400).json({ error: "Completá nombre y contacto." });
      if (!SERVICES.includes(b.service)) return res.status(400).json({ error: "Experiencia inválida." });
      if (!validSlot(b.date, b.time)) return res.status(400).json({ error: "Ese horario no está disponible." });
      const ev = await insertExclusive(b.date, b.time, {
        summary: `Serenity · ${b.service} — ${name}`,
        description: `Clienta: ${name}\nContacto: ${contact}\nExperiencia: ${b.service}\n\nReservado desde la web.`,
        location: SPA_ADDRESS,
        extendedProperties: { private: { serenity: "booking", service: b.service, name, contact } }
      });
      if (!ev) return res.status(409).json({ error: "taken" });
      return res.status(200).json({ ok: true, booking: toBooking(ev) });
    }

    // El resto de las acciones son del equipo.
    if (!isAdmin(b.code)) return res.status(401).json({ error: "Código incorrecto." });

    if (b.action === "list") return res.status(200).json({ ok: true, ...(await adminList()) });

    if (b.action === "block") {
      if (!validSlot(b.date, b.time)) return res.status(400).json({ error: "Horario inválido." });
      const ev = await insertExclusive(b.date, b.time, {
        summary: "Serenity · Horario bloqueado",
        extendedProperties: { private: { serenity: "blocked" } }
      });
      if (!ev) return res.status(409).json({ error: "taken" });
      return res.status(200).json({ ok: true, ...(await adminList()) });
    }

    if (b.action === "cancel" || b.action === "unblock") {
      const id = String(b.id || "");
      const ev = await gcal("/" + encodeURIComponent(id));
      // Solo se borran eventos creados por la web, nunca eventos personales del calendario.
      if (kind(ev) !== (b.action === "cancel" ? "booking" : "blocked")) return res.status(400).json({ error: "Evento inválido." });
      await gcal("/" + encodeURIComponent(id), { method: "DELETE" });
      return res.status(200).json({ ok: true, ...(await adminList()) });
    }

    return res.status(400).json({ error: "Acción desconocida." });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
