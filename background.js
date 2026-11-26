// Botón de la barra: abre el panel en la pestaña de WhatsApp Web (o abre WhatsApp Web).
const WA = "https://web.whatsapp.com/";

async function toggleIn(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: () => {
        if (window.Sonistick && window.Sonistick.panel) { window.Sonistick.panel.toggle(); return true; }
        return false;
      },
    }).then(([r]) => {
      if (!r || !r.result) chrome.tabs.reload(tabId); // pestaña abierta antes de instalar la extensión
    });
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
