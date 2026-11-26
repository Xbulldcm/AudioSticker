// Fuentes visuales (video, GIF/WebP/APNG animado, imagen fija) y captura de cuadros.
(() => {
  const S = (window.Sonistick = window.Sonistick || {});

  function waitEvent(el, ok, bad = "error", ms = 20000) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { clean(); reject(new Error("Tiempo agotado esperando " + ok)); }, ms);
      const y = () => { clean(); resolve(); };
      const n = () => { clean(); reject(new Error("No se pudo leer el archivo")); };
      function clean() { clearTimeout(t); el.removeEventListener(ok, y); el.removeEventListener(bad, n); }
      el.addEventListener(ok, y);
      el.addEventListener(bad, n);
    });
  }

  async function openVideo(file) {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.src = url;
    await waitEvent(v, "loadeddata");
    const duration = await S.videoDuration(v, file);
    return {
      kind: "video", url, el: v, width: v.videoWidth, height: v.videoHeight, duration,
      async frameAt(t) {
        const target = Math.max(0, Math.min(duration - 0.001, t));
        if (Math.abs(v.currentTime - target) > 1e-4 || v.seeking) {
          v.currentTime = target;
          await waitEvent(v, "seeked");
        }
        return v;
      },
      close() { v.removeAttribute("src"); v.load(); URL.revokeObjectURL(url); },
    };
  }

  // Duración de un video ya cargado. Las grabaciones WebM no la traen: se busca hasta el final
  // y, si aun así no aparece, se usa la duración conocida de la grabación.
  S.durationHints = S.durationHints || new WeakMap();
  S.videoDuration = async function (v, file) {
    if (isFinite(v.duration) && v.duration > 0) return v.duration;
    const hint = S.durationHints.get(file);
    try {
      v.currentTime = 1e7;
      await waitEvent(v, "seeked", "error", 5000);
    } catch (e) { /* usar la pista */ }
    const d = isFinite(v.duration) && v.duration > 0 ? v.duration : hint;
    v.currentTime = 0;
    if (!(d > 0)) throw new Error("No se pudo saber cuánto dura el video");
    return d;
  };

  async function openAnimated(file) {
    const dec = new ImageDecoder({ data: file.stream(), type: file.type });
    await dec.tracks.ready;
    const track = dec.tracks.selectedTrack;
    await dec.completed.catch(() => {});
    const count = track.frameCount;
    const list = [];
    let t = 0;
    for (let i = 0; i < count; i++) {
      const { image } = await dec.decode({ frameIndex: i });
      const bmp = await createImageBitmap(image);
      const dur = Math.max(20, (image.duration || 100000) / 1000) / 1000; // s; GIF sin duración → 0,1 s
      image.close();
      list.push({ bmp, start: t, dur });
      t += dur;
    }
    dec.close();
    if (count <= 1) {
      return { kind: "still", width: list[0].bmp.width, height: list[0].bmp.height, duration: 0, frameAt: async () => list[0].bmp, close() { list[0].bmp.close(); } };
    }
    return {
      kind: "animated", width: list[0].bmp.width, height: list[0].bmp.height, duration: t,
      async frameAt(time) {
        let f = list[0];
        for (const x of list) { if (x.start <= time + 1e-6) f = x; else break; }
        return f.bmp;
      },
      close() { list.forEach((x) => x.bmp.close()); },
    };
  }

  async function openStill(file) {
    const bmp = await createImageBitmap(file);
    return { kind: "still", width: bmp.width, height: bmp.height, duration: 0, frameAt: async () => bmp, close() { bmp.close(); } };
  }

  S.openVisual = async function (file) {
    const type = file.type || "";
    if (type.startsWith("video/")) return openVideo(file);
    const animatedTypes = ["image/gif", "image/webp", "image/apng", "image/png"];
    if (animatedTypes.includes(type) && typeof ImageDecoder !== "undefined") {
      try { return await openAnimated(file); } catch (e) { /* probar como imagen fija */ }
    }
    if (type.startsWith("image/")) return openStill(file);
    throw new Error("Formato no reconocido: " + (type || file.name));
  };


  // Captura los cuadros de una línea de tiempo.
  // opts: {start, end, fps, look (ver look.js), side, duration (largo final), extend: "none"|"loop"|"freeze"}
  S.captureFrames = async function (src, opts, onProgress = () => {}) {
    const side = opts.side || 512;
    const canvas = new OffscreenCanvas(side, side);
    const look = opts.look || S.defaultLook();
    const ctx = canvas.getContext("2d", { willReadFrequently: !!look.key });
    if (src.kind === "still") {
      S.drawFrame(ctx, await src.frameAt(0), src.width, src.height, side, look);
      return { frames: [{ bmp: canvas.transferToImageBitmap(), duration: Math.round((opts.duration || 1) * 1000) }], fps: 0 };
    }
    const segLen = opts.end - opts.start;
    const total = opts.extend && opts.extend !== "none" && opts.duration > segLen ? opts.duration : segLen;
    const n = Math.max(1, Math.round(total * opts.fps));
    const step = 1000 / opts.fps;
    const frames = [];
    for (let i = 0; i < n; i++) {
      const tau = (i + 0.5) / opts.fps; // centro del intervalo del cuadro
      let t;
      if (tau <= segLen) t = opts.start + tau;
      else if (opts.extend === "loop") t = opts.start + (tau % segLen);
      else t = opts.end - 0.5 / opts.fps;
      const img = await src.frameAt(t);
      S.drawFrame(ctx, img, src.width, src.height, side, look);
      frames.push({ bmp: canvas.transferToImageBitmap(), duration: step });
      if (i % 5 === 0) onProgress(i / n);
    }
    // Redondear duraciones a ms enteros sin acumular error.
    let acc = 0;
    frames.forEach((f, i) => { const next = Math.round((i + 1) * step); f.duration = next - acc; acc = next; });
    return { frames, fps: opts.fps };
  };
})();
