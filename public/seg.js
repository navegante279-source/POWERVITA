// Seguimiento propio de Power Vita: qué pasos hace cada visita, para verlos en /app.
// No usa cookies. Nombre y teléfono se envían solo cuando la persona toca Pagar.
// Tus dispositivos no cuentan: al entrar a /app, o abriendo cualquier página con ?noseg=1.
(function () {
  var mio = false;
  try {
    if (/[?&]noseg=1/.test(location.search)) localStorage.setItem("pv_noseg", "1");
    mio = localStorage.getItem("pv_noseg") === "1";
  } catch (_) {}

  var sid = "";
  try {
    sid = sessionStorage.getItem("pv_sid") || "";
    if (!sid) { sid = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10); sessionStorage.setItem("pv_sid", sid); }
  } catch (_) { sid = "s-" + Math.random().toString(36).slice(2, 12); }

  var q = new URLSearchParams(location.search);
  var origen = "";
  try {
    origen = q.get("utm_content") || q.get("utm_campaign") || sessionStorage.getItem("pv_origen") || "";
    if (origen) sessionStorage.setItem("pv_origen", origen);
  } catch (_) { origen = q.get("utm_content") || ""; }
  var disp = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? "celular" : "computadora";

  function enviar(paso, datos) {
    if (mio) return;
    var d = Object.assign({ sid: sid, paso: paso, origen: origen, disp: disp }, datos || {});
    var cuerpo = JSON.stringify(d);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon("/api/panel?a=seg", new Blob([cuerpo], { type: "text/plain" }))) return;
    } catch (_) {}
    try { fetch("/api/panel?a=seg", { method: "POST", headers: { "Content-Type": "text/plain" }, body: cuerpo, keepalive: true }); } catch (_) {}
  }
  window.pvSeg = enviar;

  // Señal de "sigue en la página" para En vivo: hasta 10 minutos por página abierta.
  var pings = 0;
  var t = setInterval(function () {
    if (document.visibilityState !== "visible") return;
    if (++pings > 10) { clearInterval(t); return; }
    enviar("ping");
  }, 60000);
})();
