// Contenedor WebP: leer los fragmentos que genera el canvas y armar un WebP animado con EXIF.
(() => {
  const S = (window.Sonistick = window.Sonistick || {});
  const te = new TextEncoder();

  function fourcc(b, o) { return String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]); }

  // Devuelve los fragmentos de imagen de un WebP simple (ALPH opcional + VP8, o VP8L).
  S.parseWebp = function (bytes) {
    if (fourcc(bytes, 0) !== "RIFF" || fourcc(bytes, 8) !== "WEBP") throw new Error("No es un WebP");
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const chunks = [];
    let o = 12;
    while (o + 8 <= bytes.length) {
      const id = fourcc(bytes, o);
      const len = dv.getUint32(o + 4, true);
      if (id === "ALPH" || id === "VP8 " || id === "VP8L") chunks.push({ id, data: bytes.subarray(o + 8, o + 8 + len) });
      o += 8 + len + (len & 1);
    }
    if (!chunks.some((c) => c.id !== "ALPH")) throw new Error("WebP sin datos de imagen");
    return chunks;
  };

  function chunk(id, data) {
    const pad = data.length & 1;
    const out = new Uint8Array(8 + data.length + pad);
    out.set(te.encode(id), 0);
    new DataView(out.buffer).setUint32(4, data.length, true);
    out.set(data, 8);
    return out;
  }
  function u24(arr, o, v) { arr[o] = v & 255; arr[o + 1] = (v >> 8) & 255; arr[o + 2] = (v >> 16) & 255; }
  function concat(parts) {
    const n = parts.reduce((a, p) => a + p.length, 0);
    const out = new Uint8Array(n);
    let o = 0;
    for (const p of parts) { out.set(p, o); o += p.length; }
    return out;
  }

  // EXIF en TIFF big-endian con una sola etiqueta 0x5741 que contiene el JSON de WhatsApp.
  S.stickerExif = function (meta) {
    const json = te.encode(JSON.stringify(meta));
    const head = new Uint8Array(26);
    const dv = new DataView(head.buffer);
    head.set([0x4d, 0x4d, 0x00, 0x2a], 0); // "MM", 42
    dv.setUint32(4, 8); // primer IFD
    dv.setUint16(8, 1); // una entrada
    dv.setUint16(10, 0x5741); // etiqueta "WA"
    dv.setUint16(12, 7); // UNDEFINED
    dv.setUint32(14, json.length);
    dv.setUint32(18, 26); // offset del valor
    dv.setUint32(22, 0); // sin más IFD
    return concat([head, json]);
  };

  // frames: [{chunks, duration(ms)}], todos del tamaño del lienzo.
  S.buildAnimatedWebp = function (frames, side, { exif = null, hasAlpha = true, loop = 0 } = {}) {
    const vp8x = new Uint8Array(10);
    vp8x[0] = 0x02 | (hasAlpha ? 0x10 : 0) | (exif ? 0x08 : 0);
    u24(vp8x, 4, side - 1);
    u24(vp8x, 7, side - 1);
    const anim = new Uint8Array(6);
    new DataView(anim.buffer).setUint16(4, loop, true); // fondo transparente, bucle infinito
    const parts = [chunk("VP8X", vp8x), chunk("ANIM", anim)];
    for (const f of frames) {
      const head = new Uint8Array(16);
      u24(head, 6, side - 1);
      u24(head, 9, side - 1);
      u24(head, 12, Math.max(8, Math.min(0xffffff, Math.round(f.duration))));
      head[15] = 0x02; // sin mezcla, sin borrado
      const body = concat([head, ...f.chunks.map((c) => chunk(c.id, c.data))]);
      parts.push(chunk("ANMF", body));
    }
    if (exif) parts.push(chunk("EXIF", exif));
    const payload = concat(parts);
    const riff = new Uint8Array(12);
    riff.set(te.encode("RIFF"), 0);
    new DataView(riff.buffer).setUint32(4, payload.length + 4, true);
    riff.set(te.encode("WEBP"), 8);
    return new Blob([riff, payload], { type: "image/webp" });
  };

  S.sha256b64 = async function (bytes) {
    const h = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
    let s = "";
    for (const b of h) s += String.fromCharCode(b);
    return btoa(s);
  };
})();
