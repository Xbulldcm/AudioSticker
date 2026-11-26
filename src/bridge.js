// Puente entre la página de WhatsApp Web (mundo MAIN) y la extensión:
// - reenvía las peticiones de YouTube al fondo;
// - da acceso al almacenamiento de la extensión (historial de stickers), que no se borra
//   aunque WhatsApp Web limpie sus datos al cerrar sesión.
(() => {
  const post = (payload) => window.postMessage(payload, location.origin);

  window.addEventListener("message", async (ev) => {
    if (ev.source !== window || !ev.data) return;
    const d = ev.data;
    if (d.sonistick === "to-bg") {
      chrome.runtime.sendMessage(d.payload).catch((e) => {
        post({ sonistick: "from-bg", payload: { type: "yt-error", id: d.payload.id, error: String(e.message || e) } });
      });
    } else if (d.sonistick === "store") {
      const area = chrome.storage.local;
      try {
        let result = null;
        if (d.op === "get") result = await area.get(d.keys);
        else if (d.op === "set") await area.set(d.items);
        else if (d.op === "remove") await area.remove(d.keys);
        else if (d.op === "bytes") result = await area.getBytesInUse(null);
        else throw new Error("Operación desconocida: " + d.op);
        post({ sonistick: "store-reply", id: d.id, result });
      } catch (e) {
        post({ sonistick: "store-reply", id: d.id, error: String(e.message || e) });
      }
    }
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && typeof msg.type === "string" && msg.type.startsWith("yt-")) post({ sonistick: "from-bg", payload: msg });
  });

  // Avisar a la página que el almacenamiento está disponible.
  post({ sonistick: "store-ready" });
  window.addEventListener("load", () => post({ sonistick: "store-ready" }));
})();
