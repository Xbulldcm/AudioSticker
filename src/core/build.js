// Arma el sticker completo: audio Ogg/Opus + WebP animado que cabe en 1 MB.
(() => {
  const S = (window.Sonistick = window.Sonistick || {});
  const MAX_WEBP = 1000000;

  async function encodeFrame(bmp, side, quality) {
    const c = new OffscreenCanvas(side, side);
    const ctx = c.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bmp, 0, 0, side, side);
    const blob = await c.convertToBlob({ type: "image/webp", quality });
    if (blob.type !== "image/webp") throw new Error("Tu navegador no puede codificar WebP");
    return new Uint8Array(await blob.arrayBuffer());
  }

  function sameBytes(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  // Toma 1 de cada `div` cuadros, sumando las duraciones de los descartados.
  function decimate(frames, div) {
    if (div <= 1) return frames;
    const out = [];
    for (let i = 0; i < frames.length; i += div) {
      let d = 0;
      for (let k = i; k < Math.min(frames.length, i + div); k++) d += frames[k].duration;
      out.push({ bmp: frames[i].bmp, duration: d });
    }
    return out;
  }

  async function estimate(frames, side, q) {
    const n = Math.min(frames.length, 8);
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(((i + 0.5) * frames.length) / n);
      sum += (await encodeFrame(frames[idx].bmp, side, q)).length + 40;
    }
    return (sum / n) * frames.length + 200;
  }

  async function encodeAll(frames, side, q, exif, onProgress) {
    const out = [];
    let prev = null;
    for (let i = 0; i < frames.length; i++) {
      const bytes = await encodeFrame(frames[i].bmp, side, q);
      if (prev && sameBytes(prev.bytes, bytes)) {
        prev.duration += frames[i].duration; // cuadro repetido: alargar el anterior
      } else {
        prev = { bytes, duration: frames[i].duration };
        out.push(prev);
      }
      if (i % 5 === 0) onProgress(i / frames.length);
    }
    const list = out.map((f) => ({ chunks: S.parseWebp(f.bytes), duration: f.duration }));
    return { blob: S.buildAnimatedWebp(list, side, { exif }), uniqueFrames: out.length };
  }

  function ladder(fps) {
    const pairsHi = [[512, 0.8], [512, 0.65], [512, 0.5], [448, 0.5], [384, 0.55], [384, 0.4], [320, 0.45]];
    const pairsLo = [[384, 0.5], [320, 0.45], [256, 0.5], [256, 0.35], [192, 0.4], [160, 0.35], [128, 0.35]];
    const steps = [];
    for (const [s, q] of pairsHi) steps.push({ side: s, q, div: 1 });
    if (fps / 2 >= 6) for (const [s, q] of pairsHi.slice(2)) steps.push({ side: s, q, div: 2 });
    const lowDiv = fps / 3 >= 5 ? 3 : fps / 2 >= 5 ? 2 : 1;
    for (const [s, q] of pairsLo) steps.push({ side: s, q, div: lowDiv });
    if (lowDiv !== 1) for (const [s, q] of pairsLo.slice(-3)) steps.push({ side: s, q, div: lowDiv + 1 });
    return steps;
  }

  /*
    opts = {
      visualFile, audioFile,        // audioFile puede ser el mismo video
      vStart, vEnd, aStart, aEnd,   // segundos
      fps, fit ("contain"|"cover"), extend ("none"|"loop"|"freeze"),
      pack, author, emoji, gain
    }
  */
  S.buildSticker = async function (opts, onProgress = () => {}) {
    const report = (stage, p) => onProgress(stage, p);

    report("Leyendo audio…", 0);
    const decoded = await S.decodeAudio(opts.audioFile);
    if (!decoded) throw new Error("No se encontró audio en el archivo elegido");
    const aEnd = Math.min(opts.aEnd ?? decoded.duration, decoded.duration);
    const pcm = S.sliceAudio(decoded.samples, opts.aStart || 0, aEnd, { gain: opts.gain || 1 });
    if (pcm.length < S.AUDIO_RATE * 0.2) throw new Error("El tramo de audio es demasiado corto");
    report("Codificando audio…", 0);
    const audio = await S.encodeAudio(pcm);

    report("Capturando cuadros…", 0);
    const src = await S.openVisual(opts.visualFile);
    let captured;
    try {
      const vEnd = src.kind === "still" ? 0 : Math.min(opts.vEnd ?? src.duration, src.duration);
      captured = await S.captureFrames(src, {
        start: opts.vStart || 0, end: vEnd, fps: opts.fps || 15, fit: opts.fit || "contain",
        side: 512, duration: audio.seconds, extend: opts.extend || "none",
      }, (p) => report("Capturando cuadros…", p));
    } finally {
      src.close();
    }

    const oggBytes = new Uint8Array(await audio.blob.arrayBuffer());
    const meta = {
      "sticker-pack-id": crypto.randomUUID(),
      "sticker-pack-name": opts.pack || "Sonistick",
      "sticker-pack-publisher": opts.author || "",
      emojis: [opts.emoji || "🔊"],
      "sound-sha256": await S.sha256b64(oggBytes),
    };
    const exif = S.stickerExif(meta);

    const frames = captured.frames;
    let result = null;
    try {
      const steps = frames.length === 1 ? ladder(1).filter((s) => s.div === 1 || s.side <= 256).map((s) => ({ ...s, div: 1 })) : ladder(captured.fps);
      for (let i = 0; i < steps.length; i++) {
        const st = steps[i];
        const used = decimate(frames, st.div);
        report(`Probando ${st.side}px · ${Math.round(captured.fps / st.div) || 1} fps…`, i / steps.length);
        const est = await estimate(used, st.side, st.q);
        if (est > MAX_WEBP * 0.97 && i < steps.length - 1) continue;
        const enc = await encodeAll(used, st.side, st.q, exif, (p) => report(`Creando sticker ${st.side}px…`, p));
        if (enc.blob.size <= MAX_WEBP) {
          result = { ...enc, side: st.side, quality: st.q, fps: captured.fps ? captured.fps / st.div : 0 };
          break;
        }
      }
    } finally {
      frames.forEach((f) => f.bmp.close());
    }
    if (!result) throw new Error("No cabe en 1 MB ni con la calidad mínima. Acorta el tramo o baja los fps.");

    report("Listo", 1);
    return {
      webp: result.blob, ogg: audio.blob,
      info: {
        side: result.side, quality: result.quality, fps: result.fps, frames: result.uniqueFrames,
        webpBytes: result.blob.size, oggBytes: audio.blob.size, audioSeconds: audio.seconds,
        audioBitrate: audio.bitrate, isAnimated: true, meta,
      },
    };
  };
})();
