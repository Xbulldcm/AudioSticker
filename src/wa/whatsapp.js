// Puente con WhatsApp Web. Usa el cargador de módulos de la propia página.
// Todo esto depende de detalles internos de WhatsApp Web y puede dejar de funcionar si cambian.
(() => {
  const S = (window.Sonistick = window.Sonistick || {});
  const WA = (S.wa = {});

  const FLAGS = ["sound_stickers_consumption_enabled", "sound_stickers_creation_enabled", "sound_stickers_audio_playing_enabled"];

  WA.ready = function () {
    try { return !!(typeof window.require === "function" && mod("WAWebChatCollection").ChatCollection); } catch (e) { return false; }
  };

  function mod(name) {
    if (typeof window.importNamespace === "function") {
      try { const m = window.importNamespace(name); if (m) return m; } catch (e) { /* usar require */ }
    }
    return window.require(name);
  }
  function modDefault(name) {
    const m = mod(name);
    return m && "default" in m ? m.default : m;
  }
  WA.mod = mod;

  // Activa la función de stickers con sonido solo en esta pestaña.
  WA.enableSoundStickers = function () {
    if (WA._enabled) return true;
    try {
      const AB = mod("WAWebABProps");
      const original = AB.getABPropConfigValue;
      if (!original._sonistick) {
        const wrapped = function (name) { return FLAGS.includes(name) ? true : original.apply(this, arguments); };
        wrapped._sonistick = true;
        AB.getABPropConfigValue = wrapped;
      }
    } catch (e) { console.warn("[Sonistick] no se pudo ajustar ABProps", e); }
    try {
      const G = mod("WAWebSoundStickerGating");
      for (const k of ["isSoundStickerConsumptionEnabled", "isSoundStickerCreationEnabled", "isSoundStickerPlaybackEnabled"]) {
        if (typeof G[k] === "function" && G[k]() !== true) G[k] = () => true;
      }
      WA._enabled = G.isSoundStickerCreationEnabled() === true;
    } catch (e) {
      console.warn("[Sonistick] módulo de stickers con sonido no encontrado", e);
      WA._enabled = false;
    }
    return WA._enabled;
  };

  WA.activeChat = function () {
    return mod("WAWebChatCollection").ChatCollection.getActive() || null;
  };

  WA.chatName = function (chat) {
    try { return chat.formattedTitle || chat.name || (chat.contact && chat.contact.pushname) || "chat"; } catch (e) { return "chat"; }
  };

  WA.selfChat = async function () {
    const me = mod("WAWebUserPrefsMeUser");
    const chats = mod("WAWebChatCollection").ChatCollection;
    let wid = null;
    for (const fn of ["getMaybeMePnUser", "getMeUserOrThrow", "getMaybeMeLidUser"]) {
      try {
        const w = typeof me[fn] === "function" ? me[fn]() : null;
        if (!w) continue;
        wid = wid || w;
        const c = chats.get(w) || chats.get(String(w._serialized || w));
        if (c) return c;
      } catch (e) { /* probar el siguiente */ }
    }
    if (!wid) throw new Error("No se encontró tu propio número");
    const r = await mod("WAWebFindChatAction").findOrCreateLatestChat(wid, "forwardSelectedModals");
    return (r && r.chat) || r;
  };

  function b64(v) {
    if (v == null || typeof v === "string") return v;
    const u = v instanceof ArrayBuffer ? new Uint8Array(v) : new Uint8Array(v.buffer, v.byteOffset || 0, v.byteLength);
    let s = "";
    for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
    return btoa(s);
  }

  // Objeto que acepta cualquier llamada de métricas y no hace nada.
  const silent = new Proxy({}, { get: () => () => undefined });

  WA.uploadAudio = async function (ogg, seconds, chat) {
    const types = mod("WAWebMmsMediaTypes").MEDIA_TYPES;
    let uploadOrigin = 1;
    try { uploadOrigin = modDefault("WAWebMediaGetUploadOriginForChat")(chat); } catch (e) { /* valor por defecto */ }
    const params = {
      blob: ogg, type: types.AUDIO, signal: new AbortController().signal, uploadQpl: silent, uploadOrigin,
      fileOrigin: undefined, userUploadAttemptCount: 0, forwardedFromWeb: false, isViewOnce: false, isHdPhoto: false,
    };
    let res;
    try {
      res = await modDefault("WAWebUploadManagerMainThread").encryptAndUpload(params, modDefault("WAWebCreateMediaUploadMetrics")(params));
    } catch (e) {
      res = await modDefault("WAWebUploadManager").encryptAndUpload(params);
    }
    const bytes = new Uint8Array(await ogg.arrayBuffer());
    const audio = {
      deprecatedMms3Url: res.url || undefined,
      directPath: res.directPath,
      mediaKey: b64(res.mediaKey),
      mediaKeyTimestamp: res.mediaKeyTimestamp,
      filehash: await S.sha256b64(bytes),
      encFilehash: b64(res.encFilehash),
      size: bytes.length,
      mimetype: "audio/ogg; codecs=opus",
      duration: Math.max(1, Math.round(seconds)),
    };
    try {
      if (mod("WAWebSoundStickerUtils").isCompleteStickerAudio(audio) !== true) throw new Error("audio incompleto");
    } catch (e) {
      throw new Error("WhatsApp no aceptó el audio subido (" + e.message + ")");
    }
    return audio;
  };

  WA.sendSticker = async function (chat, webp, info, stickerAudio) {
    const opaque = await modDefault("WAWebMediaOpaqueData").createFromData(webp, "image/webp");
    const MediaPrep = modDefault("WAWebMediaPrep");
    const prep = new MediaPrep("sticker", Promise.resolve({
      type: "sticker", mediaBlob: opaque, mimetype: "image/webp", size: webp.size,
      fullWidth: info.side, fullHeight: info.side, isAnimated: true, emojis: info.meta.emojis,
    }));
    const res = await prep.sendToChat({ chat, options: { stickerAudio } });
    const OK = mod("WAWebSendMsgResultAction").SendMsgResult.OK;
    if (!res || res.messageSendResult !== OK) throw new Error("WhatsApp no pudo enviar el sticker (" + (res && res.messageSendResult) + ")");
    return res.msg;
  };

  // target: "active" (chat abierto) o "self" (tu propio chat)
  WA.send = async function ({ webp, ogg, info }, target, onStep = () => {}) {
    if (!WA.ready()) throw new Error("WhatsApp Web todavía no terminó de cargar");
    if (!WA.enableSoundStickers()) console.warn("[Sonistick] la función de stickers con sonido no quedó activa; el audio podría descartarse");
    onStep("Buscando el chat…");
    const chat = target === "self" ? await WA.selfChat() : WA.activeChat();
    if (!chat) throw new Error("Abre primero un chat en WhatsApp Web");
    onStep("Subiendo audio…");
    const stickerAudio = await WA.uploadAudio(ogg, info.audioSeconds, chat);
    onStep("Enviando sticker…");
    await WA.sendSticker(chat, webp, info, stickerAudio);
    return WA.chatName(chat);
  };
})();
