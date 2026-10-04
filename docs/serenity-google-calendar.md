# Serenity Holistic Spa — agenda conectada a Google Calendar

La página de reservas vive en `/serenity` (`public/serenity/index.html`) y usa la
función `api/serenity.js`. El **Google Calendar del spa es la agenda**:

- Cada reserva de la web se crea como evento en el calendario (con nombre, contacto y experiencia).
- Cualquier evento que el equipo agende a mano en ese calendario ocupa el horario en la web
  (un día libre, un turno tomado por teléfono, etc.). Eventos de día completo bloquean el día entero.
  Los eventos marcados como "Disponible" no bloquean.
- Desde "Acceso equipo" se ven las reservas, se cancelan (se borran del calendario) y se bloquean horarios.
  Solo se pueden borrar eventos creados por la web, nunca eventos personales.
- La web pública solo recibe qué horarios están ocupados, nunca los datos de las clientas.

## Configuración (una sola vez, ~20 minutos)

### 1. Crear la cuenta de servicio en Google Cloud
1. Entrá a <https://console.cloud.google.com/> con la cuenta de Google del spa.
2. Arriba, en el selector de proyectos → **Proyecto nuevo** → nombre `serenity-agenda` → Crear.
3. Menú → **APIs y servicios → Biblioteca** → buscá **Google Calendar API** → **Habilitar**.
4. Menú → **IAM y administración → Cuentas de servicio** → **Crear cuenta de servicio**
   → nombre `agenda-web` → Crear y continuar → Listo (no hace falta darle roles).
5. Entrá a la cuenta creada → pestaña **Claves** → **Agregar clave → Crear clave nueva → JSON**.
   Se descarga un archivo `.json`. **Guardalo en privado y no lo subas al repositorio.**

### 2. Compartir el calendario del spa con la cuenta de servicio
1. Abrí <https://calendar.google.com/> con la cuenta del spa.
2. (Recomendado) Creá un calendario nuevo "Serenity — Reservas": a la izquierda, **Otros calendarios → + → Crear calendario**.
3. En la configuración de ese calendario → **Compartir con personas específicas → Agregar personas**
   → pegá el email de la cuenta de servicio (`agenda-web@serenity-agenda.iam.gserviceaccount.com`, figura en el JSON como `client_email`)
   → permiso **Hacer cambios en eventos** → Enviar.
4. Más abajo, en **Integrar el calendario**, copiá el **ID del calendario** (termina en `@group.calendar.google.com`).
   Si usás el calendario principal, el ID es el email del spa.

### 3. Cargar las variables en Vercel
En el proyecto de Vercel → **Settings → Environment Variables**, agregá (para Production):

| Variable | Valor |
| --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | el `client_email` del JSON |
| `GOOGLE_PRIVATE_KEY` | el `private_key` del JSON, completo, incluyendo `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----` (tal cual aparece, con los `\n`) |
| `SERENITY_CALENDAR_ID` | el ID del calendario del paso 2 |
| `SERENITY_ADMIN_CODE` | el código para "Acceso equipo" — usá uno nuevo y largo (no el del artefacto anterior) |

Después hacé **Redeploy** para que tome las variables.

### 4. Probar
1. Abrí `https://<tu-dominio>/serenity` → debería mostrar los horarios.
   Si ves "No pudimos cargar la agenda", abrí `https://<tu-dominio>/api/serenity`: el mensaje dice qué falta.
2. Hacé una reserva de prueba → tiene que aparecer en Google Calendar.
3. Entrá a "Acceso equipo" con tu código y cancelala → desaparece del calendario.
