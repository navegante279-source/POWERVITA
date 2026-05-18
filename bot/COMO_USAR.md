# 🌿 POWERVITA FuXion Bot — Guía de instalación

## ¿Qué hace este bot?

Automatiza tu WhatsApp con IA. Cuando un cliente te escribe, el bot responde automáticamente:

| Opción | Función |
|--------|---------|
| 1 | Catálogo completo de 14 productos FuXion |
| 2 | Análisis de síntomas con IA → recomienda productos |
| 3 | Plan nutricional personalizado con IA |
| 4 | Info del negocio + proyección de ingresos con IA |
| 5 | Captura el lead y te avisa por WhatsApp |

Para cualquier consulta libre, el bot responde con IA (Claude) usando el contexto completo de FuXion.

---

## Requisitos

- Computadora o servidor con **Node.js 18+**
- Cuenta de WhatsApp (puede ser tu número de negocio)
- API Key de Anthropic (la misma que usás en Vercel)

---

## Instalación paso a paso

### 1. Instalar dependencias

```bash
cd bot
npm install
```

> La primera instalación puede tardar 2-3 minutos porque descarga Chromium (necesario para WhatsApp Web).

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Abrí el archivo `.env` y completá:

```
ANTHROPIC_API_KEY=tu-api-key-de-anthropic
WA_BUSINESS_NUMBER=59898950206
WA_LEADS_NUMBER=59898950206
```

### 3. Iniciar el bot

```bash
npm start
```

Vas a ver un **código QR** en la terminal. 

### 4. Conectar WhatsApp

1. Abrí WhatsApp en tu teléfono
2. Tocá los 3 puntos (menú) → **Dispositivos vinculados**
3. Tocá **Vincular un dispositivo**
4. Escaneá el QR de la terminal

✅ ¡Listo! El bot ya está activo.

---

## Cómo funciona

```
Cliente escribe → Bot detecta el tema → Responde automáticamente
                                      → Si pide asesor → Te notifica a vos
```

La sesión se guarda automáticamente. Si cerrás y volvés a abrir el bot, **no necesitás escanear el QR de nuevo**.

---

## Ejecutar en segundo plano (para que corra siempre)

Instalá PM2:

```bash
npm install -g pm2
pm2 start index.js --name "powervita-bot"
pm2 save
pm2 startup
```

Con esto el bot se reinicia solo si falla o si reiniciás el servidor.

---

## Personalizar respuestas

Para cambiar el comportamiento del bot, editá la variable `SYSTEM_PROMPT` en `index.js`. Podés ajustar:
- El tono del bot
- Qué información priorizar
- Cómo cerrar ventas

---

## ⚠️ Importante

- Usá un número de WhatsApp **exclusivo para el bot** si tu volumen de mensajes es alto.
- WhatsApp puede desconectar la sesión cada cierto tiempo. PM2 la mantiene activa.
- Para uso comercial intensivo, considerá la **WhatsApp Business API** oficial.
