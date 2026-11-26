// Puente entre la página de WhatsApp Web (mundo MAIN) y el fondo de la extensión.
// Solo reenvía los mensajes de YouTube; el resto de la extensión no lo necesita.
(() => {
  window.addEventListener("message", (ev) => {
    if (ev.source !== window || !ev.data || ev.data.sonistick !== "to-bg") return;
    chrome.runtime.sendMessage(ev.data.payload).catch((e) => {
      window.postMessage({ sonistick: "from-bg", payload: { type: "yt-error", id: ev.data.payload.id, error: String(e.message || e) } }, location.origin);
    });
  });
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && typeof msg.type === "string" && msg.type.startsWith("yt-")) {
      window.postMessage({ sonistick: "from-bg", payload: msg }, location.origin);
    }
  });
})();
