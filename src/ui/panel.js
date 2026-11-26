// Panel flotante dentro de WhatsApp Web (Shadow DOM para no mezclar estilos).
(() => {
  const S = (window.Sonistick = window.Sonistick || {});
  if (S.panel) return;

  const CSS = `
  :host { all: initial; }
  * { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .wrap { --bg:#ffffff; --fg:#111b21; --muted:#667781; --line:#e2e6e9; --soft:#f3f5f6; --accent:#0b8f6a; --accent-fg:#fff; --warn:#b3261e;
    position: fixed; top: 16px; right: 16px; width: 380px; max-height: calc(100vh - 32px); overflow: auto;
    background: var(--bg); color: var(--fg); border: 1px solid var(--line); border-radius: 14px;
    box-shadow: 0 12px 40px rgba(0,0,0,.25); z-index: 2147483000; font-size: 13px; }
  @media (prefers-color-scheme: dark) {
    .wrap { --bg:#1f2c34; --fg:#e9edef; --muted:#8696a0; --line:#2f3f48; --soft:#26353e; --accent:#21c08b; --accent-fg:#06281d; --warn:#ff8a80; }
  }
  .hidden { display: none !important; }
  header { display:flex; align-items:center; gap:8px; padding: 12px 14px; border-bottom: 1px solid var(--line); position: sticky; top:0; background: var(--bg); z-index: 1; }
  header b { font-size: 15px; flex: 1; }
  header small { color: var(--muted); font-weight: 400; margin-left: 4px; }
  .x { border:0; background:transparent; color:var(--muted); font-size:20px; cursor:pointer; line-height:1; }
  .tabs { display:flex; gap:4px; padding: 10px 14px 0; }
  .tab { flex:1; padding:8px 6px; border:1px solid var(--line); background:var(--soft); color:var(--fg); border-radius:8px; cursor:pointer; font-size:12.5px; }
  .tab.on { background: var(--accent); color: var(--accent-fg); border-color: var(--accent); font-weight:600; }
  section { padding: 10px 14px; }
  h4 { margin: 10px 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
  label.file { display:block; padding: 10px; border: 1.5px dashed var(--line); border-radius: 10px; text-align:center; cursor:pointer; color: var(--muted); }
  label.file:hover { border-color: var(--accent); color: var(--fg); }
  label.file input { display:none; }
  .media { width:100%; max-height: 200px; background: #000; border-radius: 8px; margin-top: 8px; display:block; object-fit: contain; }
  img.media { background: repeating-conic-gradient(#ccc 0 25%, #fff 0 50%) 0 0/16px 16px; }
  .row { display:flex; align-items:center; gap:8px; margin: 6px 0; }
  .row > span:first-child { width: 52px; color: var(--muted); }
  .row input[type=range] { flex:1; accent-color: var(--accent); }
  .row output { width: 54px; text-align:right; font-variant-numeric: tabular-nums; }
  .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .grid label { display:flex; flex-direction:column; gap:3px; color: var(--muted); font-size:12px; }
  select, input[type=text] { width:100%; padding:7px 8px; border:1px solid var(--line); border-radius:8px; background: var(--soft); color: var(--fg); font-size: 13px; }
  button.btn { padding: 9px 12px; border-radius: 9px; border: 1px solid var(--line); background: var(--soft); color: var(--fg); cursor:pointer; font-size: 13px; }
  button.btn.primary { background: var(--accent); color: var(--accent-fg); border-color: var(--accent); font-weight: 600; }
  button.btn:disabled { opacity:.5; cursor: default; }
  .full { width: 100%; }
  .small { font-size: 12px; padding: 5px 8px; }
  .hint { color: var(--muted); font-size: 12px; margin: 4px 0; }
  .err { color: var(--warn); font-size: 12.5px; margin: 6px 0; white-space: pre-wrap; }
  .bar { height: 6px; background: var(--soft); border-radius: 3px; overflow: hidden; margin-top: 6px; }
  .bar i { display:block; height:100%; width:0; background: var(--accent); transition: width .15s; }
  details.yt { margin-top: 8px; border: 1px solid var(--line); border-radius: 10px; padding: 8px 10px; }
  details.yt summary { cursor: pointer; color: var(--muted); }
  details.yt[open] summary { margin-bottom: 8px; }
  details.yt > input, details.yt .grid { margin-bottom: 8px; }
  canvas.wave { width: 100%; height: 56px; display:block; background: var(--soft); border-radius: 8px; margin-top: 8px; }
  .result { display:flex; gap: 10px; align-items:flex-start; }
  .result img { width: 128px; height: 128px; border-radius: 10px; background: repeating-conic-gradient(#ccc 0 25%, #fff 0 50%) 0 0/16px 16px; flex: none; }
  .stats { color: var(--muted); font-size: 12px; line-height: 1.6; }
  .actions { display:grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
  .actions .wide { grid-column: 1 / -1; }
  `;

  const HTML = `
  <div class="wrap hidden" part="panel">
    <header><b>Sonistick<small>stickers con sonido</small></b><button class="x" data-act="close" title="Cerrar">×</button></header>
    <div class="tabs">
      <button class="tab on" data-tab="video">Video con sonido</button>
      <button class="tab" data-tab="image">Imagen o GIF + audio</button>
    </div>

    <section data-pane="video">
      <label class="file">Elegir video…<input type="file" accept="video/*" data-in="video"></label>
      <details class="yt" data-el="yt">
        <summary>…o traerlo de YouTube</summary>
        <input type="text" data-yt="url" placeholder="https://www.youtube.com/watch?v=…">
        <div class="grid">
          <label>Desde (m:ss)<input type="text" data-yt="start" placeholder="0:00"></label>
          <label>Hasta (m:ss)<input type="text" data-yt="end" placeholder="0:05"></label>
        </div>
        <button class="btn full" data-act="ytgo">Traer tramo de YouTube</button>
        <p class="hint">Se abre el video en una pestaña, se graba ese tramo en tiempo real (máx. 30 s, se oirá) y vuelve aquí. Luego puedes afinar el recorte abajo.</p>
        <p class="hint" data-el="ytmsg"></p>
      </details>
      <video class="media hidden" data-el="vprev" controls muted playsinline></video>
      <div data-el="vtrim" class="hidden">
        <h4>Tramo</h4>
        <div class="row"><span>Inicio</span><input type="range" min="0" step="0.01" data-r="vs"><output data-o="vs"></output></div>
        <div class="row"><span>Fin</span><input type="range" min="0" step="0.01" data-r="ve"><output data-o="ve"></output></div>
        <div class="row"><button class="btn small" data-act="vplay">▶ Ver tramo</button><span class="hint" data-o="vlen"></span></div>
      </div>
    </section>

    <section data-pane="image" class="hidden">
      <label class="file">Elegir imagen, GIF o WebP…<input type="file" accept="image/*,video/*" data-in="image"></label>
      <img class="media hidden" data-el="iprev" alt="">
      <p class="hint hidden" data-el="ianim"></p>
      <h4>Audio</h4>
      <label class="file">Elegir audio (MP3, M4A, OGG, WAV o un video)…<input type="file" accept="audio/*,video/*" data-in="audio"></label>
      <div data-el="atrim" class="hidden">
        <canvas class="wave" width="700" height="112" data-el="wave"></canvas>
        <div class="row"><span>Inicio</span><input type="range" min="0" step="0.01" data-r="as"><output data-o="as"></output></div>
        <div class="row"><span>Fin</span><input type="range" min="0" step="0.01" data-r="ae"><output data-o="ae"></output></div>
        <div class="row"><button class="btn small" data-act="aplay">▶ Escuchar tramo</button><span class="hint" data-o="alen"></span></div>
      </div>
      <div data-el="extendRow" class="hidden">
        <h4>Si la animación dura menos que el audio</h4>
        <select data-opt="extend">
          <option value="none">Cada uno con su duración</option>
          <option value="loop">Repetir la animación</option>
          <option value="freeze">Quedarse en el último cuadro</option>
        </select>
      </div>
    </section>

    <section>
      <h4>Formato</h4>
      <div class="grid">
        <label>Fluidez<select data-opt="fps"><option>10</option><option selected>15</option><option>20</option><option>25</option><option>30</option></select></label>
        <label>Encuadre<select data-opt="fit"><option value="contain">Completo</option><option value="cover">Recortar al cuadrado</option></select></label>
        <label>Paquete<input type="text" data-opt="pack" placeholder="Sonistick" maxlength="60"></label>
        <label>Autor<input type="text" data-opt="author" placeholder="(opcional)" maxlength="60"></label>
        <label>Emoji<input type="text" data-opt="emoji" value="🔊" maxlength="8"></label>
        <label>Volumen<select data-opt="gain"><option value="0.5">50 %</option><option value="1" selected>100 %</option><option value="1.5">150 %</option><option value="2">200 %</option></select></label>
      </div>
      <p class="hint">Se ajusta solo para quedar bajo 1 MB: si el tramo es largo, baja la resolución o los fps.</p>
      <button class="btn primary full" data-act="create" disabled>Crear sticker</button>
      <div data-el="prog" class="hidden"><p class="hint" data-o="stage"></p><div class="bar"><i data-el="barfill"></i></div></div>
      <p class="err hidden" data-el="err"></p>
    </section>

    <section data-el="result" class="hidden">
      <h4>Resultado</h4>
      <div class="result">
        <img data-el="rimg" alt="Vista previa del sticker">
        <div class="stats" data-el="rstats"></div>
      </div>
      <audio data-el="raudio" class="hidden"></audio>
      <div class="actions">
        <button class="btn wide" data-act="rplay">▶ Probar con sonido</button>
        <button class="btn primary" data-act="sendActive">Enviar al chat abierto</button>
        <button class="btn" data-act="sendSelf">Enviármelo a mí</button>
        <button class="btn wide small" data-act="download">Descargar archivos (.webp + .ogg)</button>
      </div>
      <p class="hint" data-el="sendmsg"></p>
    </section>
  </div>`;

  const fmt = (t) => (isFinite(t) ? t.toFixed(2) + " s" : "–");
  const kb = (n) => (n / 1024).toFixed(0) + " KB";

  function mount() {
    const host = document.createElement("div");
    host.id = "sonistick-root";
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${CSS}</style>${HTML}`;
    document.documentElement.appendChild(host);

    const q = (sel) => root.querySelector(sel);
    const el = (n) => q(`[data-el="${n}"]`);
    const out = (n) => q(`[data-o="${n}"]`);
    const rng = (n) => q(`[data-r="${n}"]`);
    const opt = (n) => q(`[data-opt="${n}"]`);
    const act = (n) => q(`[data-act="${n}"]`);
    const wrap = q(".wrap");

    const st = { tab: "video", video: null, image: null, imageInfo: null, audio: null, audioDecoded: null, result: null, urls: [], busy: false };

    function track(url) { st.urls.push(url); return url; }
    function show(node, on) { node.classList.toggle("hidden", !on); }
    function setError(msg) { el("err").textContent = msg || ""; show(el("err"), !!msg); }

    function refreshCreate() {
      const ok = st.tab === "video" ? !!st.video && !!st.videoReady : !!st.image && !!st.audioDecoded;
      act("create").disabled = !ok || st.busy;
    }

    // ---------- pestañas
    root.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => {
      st.tab = b.dataset.tab;
      root.querySelectorAll(".tab").forEach((x) => x.classList.toggle("on", x === b));
      root.querySelectorAll("[data-pane]").forEach((p) => show(p, p.dataset.pane === st.tab));
      refreshCreate();
    }));

    // ---------- tramos
    function bindTrim(sKey, eKey, lenKey, onChange) {
      const s = rng(sKey), e = rng(eKey);
      const upd = (which) => {
        let a = +s.value, z = +e.value;
        if (a > z - 0.1) { if (which === "s") s.value = a = Math.max(0, z - 0.1); else e.value = z = Math.min(+e.max, a + 0.1); }
        out(sKey).textContent = fmt(a);
        out(eKey).textContent = fmt(z);
        out(lenKey).textContent = "Duración: " + fmt(z - a);
        onChange && onChange(which, a, z);
      };
      s.addEventListener("input", () => upd("s"));
      e.addEventListener("input", () => upd("e"));
      return (max, defEnd) => {
        s.max = e.max = max;
        s.value = 0;
        e.value = Math.min(max, defEnd);
        upd();
      };
    }

    const vprev = el("vprev");
    const setVideoTrim = bindTrim("vs", "ve", "vlen", (which, a, z) => {
      if (which) { vprev.pause(); vprev.currentTime = which === "s" ? a : z; }
    });
    let vStopAt = null;
    vprev.addEventListener("timeupdate", () => { if (vStopAt != null && vprev.currentTime >= vStopAt) { vprev.pause(); vStopAt = null; } });
    act("vplay").addEventListener("click", () => {
      vprev.muted = false;
      vprev.currentTime = +rng("vs").value;
      vStopAt = +rng("ve").value;
      vprev.play();
    });

    q('[data-in="video"]').addEventListener("change", (ev) => { if (ev.target.files[0]) loadVideo(ev.target.files[0]); });
    async function loadVideo(f) {
      setError("");
      st.video = f;
      st.videoReady = false;
      vprev.src = track(URL.createObjectURL(f));
      show(vprev, true);
      q('[data-in="video"]').parentElement.firstChild.textContent = f.name;
      await new Promise((r) => { vprev.onloadedmetadata = r; vprev.onerror = r; });
      let dur;
      try { dur = await S.videoDuration(vprev, f); } catch (e) { dur = NaN; }
      if (!isFinite(dur) || !dur) { setError("No se pudo leer ese video. Prueba con MP4 o WebM."); return; }
      st.videoDuration = dur;
      setVideoTrim(dur, 5);
      show(el("vtrim"), true);
      st.videoReady = true;
      refreshCreate();
    }

    // ---------- YouTube
    function parseTime(txt) {
      const t = String(txt || "").trim().replace(",", ".");
      if (!t) return NaN;
      const parts = t.split(":").map(Number);
      if (parts.some((n) => !isFinite(n) || n < 0)) return NaN;
      return parts.reduce((acc, n) => acc * 60 + n, 0);
    }
    q('[data-yt="url"]').addEventListener("change", () => {
      // Si el link trae ?t=…, usarlo como inicio.
      try {
        const u = new URL(q('[data-yt="url"]').value.trim());
        const t = u.searchParams.get("t") || u.searchParams.get("start");
        if (t && !q('[data-yt="start"]').value) {
          const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
          const sec = m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : NaN;
          if (isFinite(sec)) {
            q('[data-yt="start"]').value = Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
            if (!q('[data-yt="end"]').value) { const e = sec + 5; q('[data-yt="end"]').value = Math.floor(e / 60) + ":" + String(e % 60).padStart(2, "0"); }
          }
        }
      } catch (e) { /* no es una URL */ }
    });
    act("ytgo").addEventListener("click", async () => {
      const url = q('[data-yt="url"]').value.trim();
      const start = parseTime(q('[data-yt="start"]').value || "0");
      const end = parseTime(q('[data-yt="end"]').value);
      setError("");
      if (!url) return setError("Pega el link del video de YouTube.");
      if (!isFinite(start) || !isFinite(end)) return setError("Escribe el inicio y el fin como 1:23 o en segundos.");
      if (end <= start) return setError("El fin tiene que ser mayor que el inicio.");
      if (end - start > 30) return setError("El tramo de YouTube puede durar como máximo 30 s.");
      act("ytgo").disabled = true;
      try {
        const file = await S.yt.record(url, start, end, (m) => (el("ytmsg").textContent = m));
        el("ytmsg").textContent = "Tramo traído de YouTube.";
        await loadVideo(file);
        setVideoTrim(st.videoDuration, st.videoDuration);
      } catch (e) {
        el("ytmsg").textContent = "";
        setError("YouTube: " + (e.message || e));
      } finally {
        act("ytgo").disabled = false;
      }
    });

    // ---------- imagen + audio
    const iprev = el("iprev");
    q('[data-in="image"]').addEventListener("change", async (ev) => {
      const f = ev.target.files[0];
      if (!f) return;
      setError("");
      st.image = f;
      q('[data-in="image"]').parentElement.firstChild.textContent = f.name;
      iprev.src = track(URL.createObjectURL(f));
      show(iprev, f.type.startsWith("image/"));
      try {
        const v = await S.openVisual(f);
        st.imageInfo = { kind: v.kind, duration: v.duration };
        v.close();
      } catch (e) {
        st.image = null;
        setError(e.message);
      }
      const anim = st.imageInfo && st.imageInfo.kind !== "still";
      el("ianim").textContent = anim ? `Animación de ${fmt(st.imageInfo.duration)}.` : "Imagen fija: el sticker dura lo que el audio.";
      show(el("ianim"), !!st.imageInfo);
      show(el("extendRow"), !!anim);
      refreshCreate();
    });

    const wave = el("wave");
    const audioEl = new Audio();
    let peaks = null;
    function drawWave() {
      if (!peaks || !st.audioDecoded) return;
      const c = wave.getContext("2d");
      const W = wave.width, H = wave.height;
      const dur = st.audioDecoded.duration;
      const a = (+rng("as").value / dur) * W, z = (+rng("ae").value / dur) * W;
      const accent = getComputedStyle(wrap).getPropertyValue("--accent").trim() || "#0b8f6a";
      const muted = getComputedStyle(wrap).getPropertyValue("--muted").trim() || "#999";
      c.clearRect(0, 0, W, H);
      for (let i = 0; i < peaks.length; i++) {
        const x = (i / peaks.length) * W;
        const h = Math.max(1, peaks[i] * (H - 8));
        c.fillStyle = x >= a && x <= z ? accent : muted;
        c.globalAlpha = x >= a && x <= z ? 1 : 0.35;
        c.fillRect(x, (H - h) / 2, Math.max(1, W / peaks.length - 1), h);
      }
      c.globalAlpha = 1;
    }
    const setAudioTrim = bindTrim("as", "ae", "alen", drawWave);
    let aStopAt = null;
    audioEl.addEventListener("timeupdate", () => { if (aStopAt != null && audioEl.currentTime >= aStopAt) { audioEl.pause(); aStopAt = null; } });
    act("aplay").addEventListener("click", () => {
      audioEl.currentTime = +rng("as").value;
      aStopAt = +rng("ae").value;
      audioEl.play();
    });

    q('[data-in="audio"]').addEventListener("change", async (ev) => {
      const f = ev.target.files[0];
      if (!f) return;
      setError("");
      st.audio = f;
      st.audioDecoded = null;
      q('[data-in="audio"]').parentElement.firstChild.textContent = f.name;
      const d = await S.decodeAudio(f);
      if (!d) { setError("No se encontró audio en ese archivo."); refreshCreate(); return; }
      st.audioDecoded = d;
      audioEl.src = track(URL.createObjectURL(f));
      peaks = S.peaks(d.samples, 160);
      show(el("atrim"), true);
      const defEnd = st.imageInfo && st.imageInfo.kind !== "still" ? Math.max(st.imageInfo.duration, 1) : 5;
      setAudioTrim(d.duration, Math.min(d.duration, defEnd));
      refreshCreate();
    });

    // ---------- crear
    act("create").addEventListener("click", async () => {
      setError("");
      st.busy = true;
      refreshCreate();
      show(el("prog"), true);
      show(el("result"), false);
      const opts = {
        fps: +opt("fps").value, fit: opt("fit").value, pack: opt("pack").value.trim(), author: opt("author").value.trim(),
        emoji: opt("emoji").value.trim() || "🔊", gain: +opt("gain").value, extend: opt("extend").value,
      };
      if (st.tab === "video") {
        Object.assign(opts, { visualFile: st.video, audioFile: st.video, vStart: +rng("vs").value, vEnd: +rng("ve").value, aStart: +rng("vs").value, aEnd: +rng("ve").value, extend: "none" });
      } else {
        Object.assign(opts, { visualFile: st.image, audioFile: st.audio, vStart: 0, vEnd: st.imageInfo ? st.imageInfo.duration : 0, aStart: +rng("as").value, aEnd: +rng("ae").value });
      }
      try {
        const r = await S.buildSticker(opts, (stage, p) => { out("stage").textContent = stage; el("barfill").style.width = Math.round((p || 0) * 100) + "%"; });
        st.result = r;
        showResult(r);
      } catch (e) {
        console.error("[Sonistick]", e);
        setError(e.message || String(e));
      } finally {
        st.busy = false;
        show(el("prog"), false);
        refreshCreate();
      }
    });

    const raudio = el("raudio");
    function showResult(r) {
      const i = r.info;
      el("rimg").src = track(URL.createObjectURL(r.webp));
      raudio.src = track(URL.createObjectURL(r.ogg));
      el("rstats").innerHTML =
        `${i.side}×${i.side} px${i.fps ? " · " + Math.round(i.fps) + " fps" : " · imagen fija"}<br>` +
        `Sticker: ${kb(i.webpBytes)} (${i.frames} cuadro${i.frames === 1 ? "" : "s"})<br>` +
        `Audio: ${kb(i.oggBytes)} · ${i.audioSeconds.toFixed(1)} s`;
      el("sendmsg").textContent = "";
      show(el("result"), true);
      el("result").scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    act("rplay").addEventListener("click", () => {
      const img = el("rimg");
      const src = img.src;
      img.src = "";
      img.src = src; // reinicia la animación
      raudio.currentTime = 0;
      raudio.play();
    });

    act("download").addEventListener("click", () => {
      if (!st.result) return;
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      for (const [blob, ext] of [[st.result.webp, "webp"], [st.result.ogg, "ogg"]]) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `sticker-${stamp}.${ext}`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      }
    });

    async function send(target) {
      if (!st.result) return;
      const btns = [act("sendActive"), act("sendSelf")];
      btns.forEach((b) => (b.disabled = true));
      setError("");
      el("sendmsg").classList.remove("err");
      try {
        const name = await S.wa.send(st.result, target, (m) => (el("sendmsg").textContent = m));
        el("sendmsg").textContent = `Enviado a ${name}. Desde el celular puedes marcarlo como favorito.`;
      } catch (e) {
        console.error("[Sonistick]", e);
        el("sendmsg").classList.add("err");
        el("sendmsg").textContent = "No se pudo enviar: " + (e.message || e);
      } finally {
        btns.forEach((b) => (b.disabled = false));
      }
    }
    act("sendActive").addEventListener("click", () => send("active"));
    act("sendSelf").addEventListener("click", () => send("self"));

    act("close").addEventListener("click", () => api.hide());

    // Evita que WhatsApp capture las teclas mientras se escribe en el panel.
    for (const t of ["keydown", "keyup", "keypress", "paste"]) host.addEventListener(t, (e) => e.stopPropagation());

    const api = {
      show() { show(wrap, true); },
      hide() { show(wrap, false); vprev.pause(); audioEl.pause(); raudio.pause(); },
      toggle() { wrap.classList.contains("hidden") ? api.show() : api.hide(); },
      root,
    };
    return api;
  }

  let instance = null;
  S.panel = {
    get() { return instance || (instance = mount()); },
    toggle() { S.panel.get().toggle(); },
    show() { S.panel.get().show(); },
  };
})();
