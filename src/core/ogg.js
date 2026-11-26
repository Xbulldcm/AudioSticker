// Empaquetador Ogg para paquetes Opus (RFC 3533 + RFC 7845).
(() => {
  const S = (window.Sonistick = window.Sonistick || {});

  const TABLE = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let r = i << 24;
    for (let k = 0; k < 8; k++) r = r & 0x80000000 ? (r << 1) ^ 0x04c11db7 : r << 1;
    TABLE[i] = r >>> 0;
  }
  function oggCrc(bytes) {
    let c = 0;
    for (let i = 0; i < bytes.length; i++) c = ((c << 8) ^ TABLE[((c >>> 24) ^ bytes[i]) & 0xff]) >>> 0;
    return c;
  }

  // Una página con paquetes completos. flags: 0x02 inicio de flujo, 0x04 fin de flujo.
  function makePage(serial, seq, granule, flags, packets) {
    const lacing = [];
    for (const p of packets) {
      let n = p.length;
      while (n >= 255) { lacing.push(255); n -= 255; }
      lacing.push(n);
    }
    if (lacing.length > 255) throw new Error("Demasiados segmentos en una página Ogg");
    const bodyLen = packets.reduce((a, p) => a + p.length, 0);
    const out = new Uint8Array(27 + lacing.length + bodyLen);
    const dv = new DataView(out.buffer);
    out.set([0x4f, 0x67, 0x67, 0x53], 0); // "OggS"
    out[4] = 0;
    out[5] = flags;
    dv.setBigUint64(6, BigInt(granule), true);
    dv.setUint32(14, serial, true);
    dv.setUint32(18, seq, true);
    dv.setUint32(22, 0, true);
    out[26] = lacing.length;
    out.set(lacing, 27);
    let off = 27 + lacing.length;
    for (const p of packets) { out.set(p, off); off += p.length; }
    dv.setUint32(22, oggCrc(out), true);
    return out;
  }

  function opusHead(preSkip, inputRate) {
    const b = new Uint8Array(19);
    const dv = new DataView(b.buffer);
    b.set(new TextEncoder().encode("OpusHead"), 0);
    b[8] = 1; // versión
    b[9] = 1; // mono
    dv.setUint16(10, preSkip, true);
    dv.setUint32(12, inputRate, true);
    dv.setInt16(16, 0, true); // ganancia
    b[18] = 0; // mapeo de canales
    return b;
  }

  function opusTags(vendor) {
    const enc = new TextEncoder();
    const v = enc.encode(vendor);
    const b = new Uint8Array(8 + 4 + v.length + 4);
    const dv = new DataView(b.buffer);
    b.set(enc.encode("OpusTags"), 0);
    dv.setUint32(8, v.length, true);
    b.set(v, 12);
    dv.setUint32(12 + v.length, 0, true);
    return b;
  }

  // packets: [{data: Uint8Array, samples: número de muestras a 48 kHz}]
  // totalSamples: muestras reales de la señal (para recortar el relleno final).
  S.muxOggOpus = function (packets, { preSkip = 312, totalSamples = null, inputRate = 48000 } = {}) {
    const serial = (Math.random() * 0xffffffff) >>> 0;
    const pages = [];
    let seq = 0;
    pages.push(makePage(serial, seq++, 0, 0x02, [opusHead(preSkip, inputRate)]));
    pages.push(makePage(serial, seq++, 0, 0, [opusTags("Sonistick")]));

    const endGranule = totalSamples != null ? preSkip + totalSamples : null;
    let granule = preSkip;
    let group = [];
    let segs = 0;
    const flush = (last) => {
      let g = granule;
      if (last && endGranule != null) g = Math.min(g, endGranule);
      pages.push(makePage(serial, seq++, g, last ? 0x04 : 0, group));
      group = [];
      segs = 0;
    };
    packets.forEach((p, i) => {
      const need = Math.floor(p.data.length / 255) + 1;
      if (segs + need > 255 || group.length >= 50) flush(false);
      group.push(p.data);
      segs += need;
      granule += p.samples;
      if (i === packets.length - 1) flush(true);
    });
    return new Blob(pages, { type: "audio/ogg; codecs=opus" });
  };

  S._oggCrc = oggCrc;
})();
