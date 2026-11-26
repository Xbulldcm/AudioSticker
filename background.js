// Fondo de la extensión: botón de la barra y grabación de tramos de YouTube.
importScripts("src/youtube.js");

const WA = "https://web.whatsapp.com/";
const MAX_YT_SECONDS = 30;

async function toggleIn(tabId) {
  try {
    const [r] = await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: () => {
        if (window.Sonistick && window.Sonistick.panel) { window.Sonistick.panel.toggle(); return true; }
        return false;
      },
    });
    if (!r || !r.result) chrome.tabs.reload(tabId); // pestaña abierta antes de instalar la extensión
  } catch (e) {
    console.warn("Sonistick:", e);
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (tab && tab.url && tab.url.startsWith(WA)) return toggleIn(tab.id);
  const [wa] = await chrome.tabs.query({ url: WA + "*" });
  if (wa) {
    await chrome.tabs.update(wa.id, { active: true });
    await chrome.windows.update(wa.windowId, { focused: true });
    return toggleIn(wa.id);
  }
  chrome.tabs.create({ url: WA });
});

// ---------------- YouTube

function youTubeId(url) {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^(www|m|music)\./, "");
    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0];
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const m = u.pathname.match(/^\/(shorts|embed|live|v)\/([\w-]{6,})/);
      if (m) return m[2];
    }
  } catch (e) { /* no es una URL */ }
  return null;
}

function waitTabComplete(tabId, ms = 45000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => { chrome.tabs.onUpdated.removeListener(fn); reject(new Error("YouTube tardó demasiado en cargar")); }, ms);
    function fn(id, info) {
      if (id === tabId && info.status === "complete") { clearTimeout(t); chrome.tabs.onUpdated.removeListener(fn); resolve(); }
    }
    chrome.tabs.onUpdated.addListener(fn);
    chrome.tabs.get(tabId).then((t) => { if (t.status === "complete" && !/^(about|chrome-error)/.test(t.url || "")) fn(tabId, t); }).catch(() => {});
  });
}

async function recordFromYouTube(msg, waTab) {
  const reply = (payload) => chrome.tabs.sendMessage(waTab.id, { id: msg.id, ...payload }).catch(() => {});
  const vid = youTubeId(msg.url || "");
  if (!vid) return reply({ type: "yt-error", error: "Ese link no parece de un video de YouTube" });
  const start = Math.max(0, Number(msg.start) || 0);
  const end = Number(msg.end);
  if (!(end > start)) return reply({ type: "yt-error", error: "El fin tiene que ser mayor que el inicio" });
  if (end - start > MAX_YT_SECONDS) return reply({ type: "yt-error", error: `El tramo puede durar como máximo ${MAX_YT_SECONDS} s` });

  let ytTab = null;
  try {
    reply({ type: "yt-progress", text: "Abriendo YouTube…" });
    // La pestaña tiene que estar activa para que el video se reproduzca y se pueda grabar.
    ytTab = await chrome.tabs.create({ url: `https://www.youtube.com/watch?v=${encodeURIComponent(vid)}&t=${Math.floor(start)}s`, active: true, windowId: waTab.windowId });
    await waitTabComplete(ytTab.id);
    reply({ type: "yt-progress", text: `Grabando ${(end - start).toFixed(1)} s desde YouTube (se oirá)…` });
    const [res] = await chrome.scripting.executeScript({
      target: { tabId: ytTab.id }, world: "MAIN", func: sonistickRecordYouTube, args: [start, end],
    });
    if (!res || !res.result) throw new Error((res && res.error && res.error.message) || "No se pudo grabar el video");
    reply({ type: "yt-done", ...res.result });
  } catch (e) {
    reply({ type: "yt-error", error: String((e && e.message) || e) });
  } finally {
    if (ytTab) chrome.tabs.remove(ytTab.id).catch(() => {});
    chrome.tabs.update(waTab.id, { active: true }).catch(() => {});
  }
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg && msg.type === "yt-record" && sender.tab) recordFromYouTube(msg, sender.tab);
});
