// Línea de tiempo para elegir un tramo: forma de onda, miniaturas opcionales,
// dos asas que se arrastran (o el tramo entero) y una marca de reproducción.
(() => {
  const S = (window.Sonistick = window.Sonistick || {});

  S.Timeline = function (canvas, { onChange = () => {}, onSeek = () => {}, minLen = 0.1, maxLen = Infinity } = {}) {
    const st = { dur: 0, a: 0, z: 0, play: null, peaks: null, thumbs: [], drag: null };
    const ctx = canvas.getContext("2d");
    const HANDLE = 14; // px en pantalla

    function css(name, fb) {
      const v = getComputedStyle(canvas).getPropertyValue(name).trim();
      return v || fb;
    }
    function sizeCanvas() {
      const r = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(100, Math.round(r.width * dpr)), h = Math.max(40, Math.round(r.height * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      return dpr;
    }
    const tx = (t) => (st.dur ? (t / st.dur) * canvas.width : 0);

    function draw() {
      const dpr = sizeCanvas();
      const W = canvas.width, H = canvas.height;
      const accent = css("--accent", "#0b8f6a"), muted = css("--muted", "#888"), soft = css("--soft", "#eee");
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = soft;
      ctx.fillRect(0, 0, W, H);
      // miniaturas
      const thumbH = st.thumbs.length ? Math.round(H * 0.55) : 0;
      if (st.thumbs.length) {
        const tw = W / st.thumbs.length;
        st.thumbs.forEach((b, i) => {
          const s = Math.max(tw / b.width, thumbH / b.height);
          const w = b.width * s, h = b.height * s;
          ctx.save();
          ctx.beginPath();
          ctx.rect(i * tw, 0, tw, thumbH);
          ctx.clip();
          ctx.drawImage(b, i * tw + (tw - w) / 2, (thumbH - h) / 2, w, h);
          ctx.restore();
        });
      }
      // forma de onda
      const wy = thumbH, wh = H - thumbH;
      if (st.peaks) {
        const n = st.peaks.length;
        const bw = W / n;
        for (let i = 0; i < n; i++) {
          const x = i * bw;
          const inside = x >= tx(st.a) && x <= tx(st.z);
          const h = Math.max(1 * dpr, st.peaks[i] * (wh - 6 * dpr));
          ctx.fillStyle = inside ? accent : muted;
          ctx.globalAlpha = inside ? 0.95 : 0.35;
          ctx.fillRect(x, wy + (wh - h) / 2, Math.max(1, bw - 1), h);
        }
        ctx.globalAlpha = 1;
      }
      // sombra fuera del tramo
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, tx(st.a), H);
      ctx.fillRect(tx(st.z), 0, W - tx(st.z), H);
      // borde del tramo y asas
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2 * dpr;
      ctx.strokeRect(tx(st.a), 1 * dpr, tx(st.z) - tx(st.a), H - 2 * dpr);
      for (const t of [st.a, st.z]) {
        const x = tx(t);
        ctx.fillStyle = accent;
        ctx.fillRect(x - 4 * dpr, 0, 8 * dpr, H);
        ctx.fillStyle = "#fff";
        ctx.fillRect(x - 1 * dpr, H * 0.35, 2 * dpr, H * 0.3);
      }
      // reproducción
      if (st.play != null) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(tx(st.play) - 1 * dpr, 0, 2 * dpr, H);
      }
    }

    function timeAt(ev) {
      const r = canvas.getBoundingClientRect();
      return Math.max(0, Math.min(st.dur, ((ev.clientX - r.left) / r.width) * st.dur));
    }
    function hit(ev) {
      const r = canvas.getBoundingClientRect();
      const px = ev.clientX - r.left;
      const xa = (st.a / st.dur) * r.width, xz = (st.z / st.dur) * r.width;
      if (Math.abs(px - xa) <= HANDLE && Math.abs(px - xa) <= Math.abs(px - xz)) return "a";
      if (Math.abs(px - xz) <= HANDLE) return "z";
      if (px > xa && px < xz) return "move";
      return "seek";
    }
    function clamp(kind) {
      st.a = Math.max(0, st.a);
      st.z = Math.min(st.dur, st.z);
      if (st.z - st.a < minLen) { if (kind === "a") st.a = Math.max(0, st.z - minLen); else st.z = Math.min(st.dur, st.a + minLen); }
      if (st.z - st.a > maxLen) { if (kind === "a") st.z = st.a + maxLen; else st.a = st.z - maxLen; }
    }

    canvas.style.touchAction = "none";
    canvas.style.cursor = "pointer";
    canvas.addEventListener("pointerdown", (ev) => {
      if (!st.dur) return;
      const kind = hit(ev);
      const t = timeAt(ev);
      if (kind === "seek") { st.play = t; draw(); onSeek(t); return; }
      st.drag = { kind, t0: t, a0: st.a, z0: st.z };
      canvas.setPointerCapture(ev.pointerId);
    });
    canvas.addEventListener("pointermove", (ev) => {
      if (!st.dur) return;
      if (!st.drag) { const k = hit(ev); canvas.style.cursor = k === "a" || k === "z" ? "ew-resize" : k === "move" ? "grab" : "pointer"; return; }
      const t = timeAt(ev);
      const d = st.drag;
      if (d.kind === "a") st.a = Math.min(t, st.z - minLen);
      else if (d.kind === "z") st.z = Math.max(t, st.a + minLen);
      else {
        const len = d.z0 - d.a0;
        st.a = Math.max(0, Math.min(st.dur - len, d.a0 + (t - d.t0)));
        st.z = st.a + len;
      }
      clamp(d.kind);
      draw();
      onChange(st.a, st.z, d.kind);
    });
    const end = () => { if (st.drag) { const k = st.drag.kind; st.drag = null; onChange(st.a, st.z, k, true); } };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    new ResizeObserver(() => draw()).observe(canvas);

    return {
      setSource({ duration, peaks = null, thumbs = [] }) {
        st.dur = duration;
        st.peaks = peaks;
        st.thumbs.forEach((b) => b.close && b.close());
        st.thumbs = thumbs;
        st.play = null;
        draw();
      },
      setThumbs(thumbs) { st.thumbs.forEach((b) => b.close && b.close()); st.thumbs = thumbs; draw(); },
      setRange(a, z) { st.a = a; st.z = z; clamp("z"); draw(); onChange(st.a, st.z, null, true); },
      nudge(which, delta) {
        if (which === "a") st.a = Math.max(0, Math.min(st.z - minLen, st.a + delta));
        else st.z = Math.min(st.dur, Math.max(st.a + minLen, st.z + delta));
        clamp(which);
        draw();
        onChange(st.a, st.z, which, true);
      },
      setPlayhead(t) { st.play = t; draw(); },
      get range() { return [st.a, st.z]; },
      get duration() { return st.dur; },
      redraw: draw,
    };
  };
})();
