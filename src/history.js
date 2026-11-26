// Historial opcional de stickers creados. Se guarda en el almacenamiento de la extensión
// (a través de bridge.js). Apagado por defecto.
(() => {
  const S = (window.Sonistick = window.Sonistick || {});
  let seq = 0;

  function call(op, extra, timeoutMs = 15000) {
    if (S.storeShim) return S.storeShim(op, extra); // páginas de prueba sin extensión
    const id = "st" + Date.now() + "-" + ++seq;
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { window.removeEventListener("message", on); reject(new Error("El almacenamiento de la extensión no responde. Recarga WhatsApp Web.")); }, timeoutMs);
      function on(ev) {
        if (ev.source !== window || !ev.data || ev.data.sonistick !== "store-reply" || ev.data.id !== id) return;
        clearTimeout(t);
        window.removeEventListener("message", on);
        ev.data.error ? reject(new Error(ev.data.error)) : resolve(ev.data.result);
      }
      window.addEventListener("message", on);
      window.postMessage({ sonistick: "store", id, op, ...extra }, location.origin);
    });
  }

  async function toB64(blob) {
    const u = new Uint8Array(await blob.arrayBuffer());
    let s = "";
    for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function fromB64(b64, type) {
    const bin = atob(b64);
    const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return new Blob([u], { type });
  }

  // Miniatura pequeña (primer cuadro) para mostrar la lista sin cargar cada sticker.
  async function thumbOf(webp) {
    try {
      const bmp = await createImageBitmap(webp);
      const c = document.createElement("canvas");
      c.width = c.height = 96;
      c.getContext("2d").drawImage(bmp, 0, 0, 96, 96);
      bmp.close();
      return c.toDataURL("image/webp", 0.7);
    } catch (e) { return null; }
  }

  const DEFAULTS = { enabled: false, max: 25 };

  S.history = {
    async settings() {
      const r = await call("get", { keys: { histSettings: DEFAULTS } });
      return { ...DEFAULTS, ...(r && r.histSettings) };
    },
    async saveSettings(s) {
      await call("set", { items: { histSettings: s } });
      await S.history.trim(s.max);
    },
    async index() {
      const r = await call("get", { keys: { histIndex: [] } });
      return (r && r.histIndex) || [];
    },
    // Guarda un sticker. Devuelve el id.
    async add(result, label) {
      const s = await S.history.settings();
      if (!s.enabled) return null;
      const id = "h" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const entry = { id, created: Date.now(), label: label || "Sticker", info: result.info, webp: await toB64(result.webp), ogg: await toB64(result.ogg) };
      await call("set", { items: { ["hist:" + id]: entry } });
      const idx = await S.history.index();
      idx.unshift({ id, created: entry.created, label: entry.label, bytes: result.webp.size + result.ogg.size, soundSeconds: result.info.soundSeconds, thumb: await thumbOf(result.webp) });
      await call("set", { items: { histIndex: idx } });
      await S.history.trim(s.max);
      return id;
    },
    async get(id) {
      const r = await call("get", { keys: ["hist:" + id] });
      const e = r && r["hist:" + id];
      if (!e) throw new Error("Ese sticker ya no está en el historial");
      return { webp: fromB64(e.webp, "image/webp"), ogg: fromB64(e.ogg, "audio/ogg; codecs=opus"), info: e.info, label: e.label, created: e.created };
    },
    async remove(id) {
      await call("remove", { keys: ["hist:" + id] });
      const idx = (await S.history.index()).filter((x) => x.id !== id);
      await call("set", { items: { histIndex: idx } });
    },
    async clear() {
      const idx = await S.history.index();
      await call("remove", { keys: idx.map((x) => "hist:" + x.id) });
      await call("set", { items: { histIndex: [] } });
    },
    async trim(max) {
      const idx = await S.history.index();
      if (idx.length <= max) return;
      const drop = idx.slice(max);
      await call("remove", { keys: drop.map((x) => "hist:" + x.id) });
      await call("set", { items: { histIndex: idx.slice(0, max) } });
    },
    async bytesInUse() { return call("bytes", {}); },
  };
})();
