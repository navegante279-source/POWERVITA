// Service worker de la app: solo permite instalarla. No guarda nada en caché: los datos siempre se leen en vivo.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
