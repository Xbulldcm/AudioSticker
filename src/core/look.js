// Aspecto del sticker: encuadre (zoom y posición), quitar un color de fondo y texto encima.
(() => {
  const S = (window.Sonistick = window.Sonistick || {});

  /*
    look = {
      fit: "contain" | "cover",
      zoom: 1..4,
      panX, panY: -1..1      (-1 = pegado a la izquierda/arriba, 1 = a la derecha/abajo)
      key: null | {r, g, b, tol: 0..1}   color de fondo a volver transparente
      top, bottom: texto, textColor, textSize: 0.08..0.25 (fracción del lado)
    }
  */
  S.defaultLook = () => ({ fit: "contain", zoom: 1, panX: 0, panY: 0, key: null, top: "", bottom: "", textColor: "#ffffff", textSize: 0.14 });

  // Rectángulo donde se dibuja la fuente dentro del cuadrado.
  S.placeRect = function (sw, sh, side, look) {
    const base = look.fit === "cover" ? Math.max(side / sw, side / sh) : Math.min(side / sw, side / sh);
    const scale = base * (look.zoom || 1);
    const w = sw * scale, h = sh * scale;
    const x = ((side - w) / 2) * (1 + (look.panX || 0));
    const y = ((side - h) / 2) * (1 + (look.panY || 0));
    return { x, y, w, h };
  };

  function applyKey(ctx, side, key) {
    const img = ctx.getImageData(0, 0, side, side);
    const d = img.data;
    const max = 441.7; // distancia máxima en RGB
    const t0 = key.tol * max, t1 = t0 + 0.08 * max; // borde suave
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const dr = d[i] - key.r, dg = d[i + 1] - key.g, db = d[i + 2] - key.b;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);
      if (dist <= t0) d[i + 3] = 0;
      else if (dist < t1) d[i + 3] = Math.round((d[i + 3] * (dist - t0)) / (t1 - t0));
    }
    ctx.putImageData(img, 0, 0);
  }

  function wrapLines(ctx, text, maxW) {
    const words = text.split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }

  function drawText(ctx, side, text, where, look) {
    if (!text || !text.trim()) return;
    let size = Math.round(side * (look.textSize || 0.14));
    const maxW = side * 0.92;
    let lines;
    // Achicar la letra hasta que quepan como mucho 3 líneas.
    for (;;) {
      ctx.font = `900 ${size}px Impact, "Arial Black", "Helvetica Neue", sans-serif`;
      lines = wrapLines(ctx, text.trim().toUpperCase(), maxW);
      const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
      if ((lines.length <= 3 && widest <= maxW) || size <= 12) break;
      size -= 2;
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(2, size * 0.16);
    ctx.strokeStyle = isLight(look.textColor) ? "#000" : "#fff";
    ctx.fillStyle = look.textColor || "#fff";
    const lh = size * 1.05;
    const pad = side * 0.04 + lh / 2;
    lines.forEach((l, i) => {
      const y = where === "top" ? pad + i * lh : side - pad - (lines.length - 1 - i) * lh;
      ctx.strokeText(l, side / 2, y);
      ctx.fillText(l, side / 2, y);
    });
  }

  function isLight(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || "#ffffff");
    const n = m ? parseInt(m[1], 16) : 0xffffff;
    return ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11 > 140;
  }

  // Dibuja un cuadro completo con el aspecto elegido.
  S.drawFrame = function (ctx, src, sw, sh, side, look) {
    look = look || S.defaultLook();
    ctx.clearRect(0, 0, side, side);
    const r = S.placeRect(sw, sh, side, look);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, r.x, r.y, r.w, r.h);
    if (look.key) applyKey(ctx, side, look.key);
    drawText(ctx, side, look.top, "top", look);
    drawText(ctx, side, look.bottom, "bottom", look);
  };
})();
