// Audio: decodificar, recortar, pasar a mono 48 kHz y codificar a Opus/Ogg con WebCodecs.
(() => {
  const S = (window.Sonistick = window.Sonistick || {});
  const RATE = 48000;
  const MAX_AUDIO_BYTES = 1000000;

  // Devuelve {samples: Float32Array mono a 48 kHz, duration}. null si el archivo no tiene audio.
  S.decodeAudio = async function (file) {
    const buf = await file.arrayBuffer();
    const ctx = new OfflineAudioContext(1, 1, RATE);
    let audio;
    try {
      audio = await ctx.decodeAudioData(buf);
    } catch (e) {
      return null;
    }
    const n = audio.length;
    const mono = new Float32Array(n);
    for (let c = 0; c < audio.numberOfChannels; c++) {
      const ch = audio.getChannelData(c);
      for (let i = 0; i < n; i++) mono[i] += ch[i] / audio.numberOfChannels;
    }
    return { samples: mono, duration: n / RATE };
  };

  // Picos para dibujar la forma de onda.
  S.peaks = function (samples, buckets) {
    const out = new Float32Array(buckets);
    const step = samples.length / buckets;
    for (let b = 0; b < buckets; b++) {
      let m = 0;
      const a = Math.floor(b * step), z = Math.min(samples.length, Math.floor((b + 1) * step));
      for (let i = a; i < z; i++) { const v = Math.abs(samples[i]); if (v > m) m = v; }
      out[b] = m;
    }
    return out;
  };

  // Recorte con fundido corto en los bordes para evitar clics.
  S.sliceAudio = function (samples, start, end, { gain = 1, fadeMs = 8 } = {}) {
    const a = Math.max(0, Math.round(start * RATE));
    const z = Math.min(samples.length, Math.round(end * RATE));
    const out = samples.slice(a, z);
    const f = Math.min(Math.round((fadeMs / 1000) * RATE), Math.floor(out.length / 2));
    for (let i = 0; i < out.length; i++) {
      let g = gain;
      if (i < f) g *= i / f;
      else if (i >= out.length - f) g *= (out.length - 1 - i) / f;
      let v = out[i] * g;
      out[i] = v > 1 ? 1 : v < -1 ? -1 : v;
    }
    return out;
  };

  // Lleva el volumen a un nivel parejo: RMS de las partes con sonido a -16 dBFS,
  // sin que el pico pase de -1 dBFS. No amplifica más de 20 dB (para no subir el ruido).
  S.normalizeAudio = function (samples) {
    const win = 2400; // 50 ms
    let sum = 0, count = 0, peak = 0;
    for (let i = 0; i < samples.length; i += win) {
      let s = 0;
      const z = Math.min(samples.length, i + win);
      for (let k = i; k < z; k++) { const v = samples[k]; s += v * v; if (Math.abs(v) > peak) peak = Math.abs(v); }
      const rms = Math.sqrt(s / (z - i));
      if (rms > 0.003) { sum += s; count += z - i; } // ignorar silencios
    }
    if (!count || !peak) return { samples, gainDb: 0 };
    const rms = Math.sqrt(sum / count);
    let gain = Math.pow(10, -16 / 20) / rms;
    gain = Math.min(gain, Math.pow(10, -1 / 20) / peak, 10);
    const out = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) out[i] = samples[i] * gain;
    return { samples: out, gainDb: 20 * Math.log10(gain) };
  };

  async function encodeOpus(samples, bitrate) {
    if (typeof AudioEncoder === "undefined") throw new Error("Tu navegador no tiene WebCodecs (AudioEncoder). Usa Chrome, Edge o Brave actualizado.");
    const packets = [];
    let preSkip = 312;
    let error = null;
    const enc = new AudioEncoder({
      output: (chunk, meta) => {
        const data = new Uint8Array(chunk.byteLength);
        chunk.copyTo(data);
        const samplesInPacket = Math.round(((chunk.duration || 20000) * RATE) / 1e6);
        packets.push({ data, samples: samplesInPacket });
        const desc = meta && meta.decoderConfig && meta.decoderConfig.description;
        if (desc) {
          const d = new Uint8Array(desc.buffer || desc, desc.byteOffset || 0, desc.byteLength);
          if (d.length >= 12 && String.fromCharCode(...d.slice(0, 8)) === "OpusHead") preSkip = d[10] | (d[11] << 8);
        }
      },
      error: (e) => { error = e; },
    });
    enc.configure({ codec: "opus", sampleRate: RATE, numberOfChannels: 1, bitrate });
    const CH = RATE; // trozos de 1 s
    for (let i = 0; i < samples.length; i += CH) {
      const part = samples.subarray(i, Math.min(samples.length, i + CH));
      const ad = new AudioData({ format: "f32", sampleRate: RATE, numberOfFrames: part.length, numberOfChannels: 1, timestamp: Math.round((i / RATE) * 1e6), data: part });
      enc.encode(ad);
      ad.close();
    }
    await enc.flush();
    enc.close();
    if (error) throw error;
    return S.muxOggOpus(packets, { preSkip, totalSamples: samples.length });
  }

  // Codifica y baja el bitrate si hace falta para quedar bajo 1 MB.
  S.encodeAudio = async function (samples) {
    for (const br of [48000, 32000, 24000, 16000, 12000, 8000]) {
      const blob = await encodeOpus(samples, br);
      if (blob.size <= MAX_AUDIO_BYTES) return { blob, bitrate: br, seconds: samples.length / RATE };
    }
    throw new Error("El audio es demasiado largo: no cabe en 1 MB ni con la calidad mínima. Recorta el tramo.");
  };

  S.AUDIO_RATE = RATE;
})();
