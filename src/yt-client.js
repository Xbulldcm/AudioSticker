// Lado de la página: pide al fondo de la extensión que grabe un tramo de YouTube.
(() => {
  const S = (window.Sonistick = window.Sonistick || {});
  let seq = 0;
  S.durationHints = S.durationHints || new WeakMap();
  S.yt = {
    record(url, start, end, onProgress = () => {}) {
      const id = "yt" + Date.now() + "-" + ++seq;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => done(new Error("Tiempo agotado esperando a YouTube")), (end - start) * 1000 + 180000);
        function done(err, val) {
          clearTimeout(timer);
          window.removeEventListener("message", onMsg);
          err ? reject(err) : resolve(val);
        }
        function onMsg(ev) {
          if (ev.source !== window || !ev.data || ev.data.sonistick !== "from-bg") return;
          const m = ev.data.payload;
          if (!m || m.id !== id) return;
          if (m.type === "yt-progress") onProgress(m.text);
          else if (m.type === "yt-error") done(new Error(m.error));
          else if (m.type === "yt-done") {
            const bin = atob(m.b64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            const name = (m.title || "youtube").replace(/[\\/:*?"<>|]+/g, " ").slice(0, 60) + ".webm";
            const file = new File([bytes], name, { type: m.mime || "video/webm" });
            S.durationHints.set(file, m.seconds); // las grabaciones WebM no traen duración
            done(null, file);
          }
        }
        window.addEventListener("message", onMsg);
        window.postMessage({ sonistick: "to-bg", payload: { type: "yt-record", id, url, start, end } }, location.origin);
      });
    },
  };
})();
