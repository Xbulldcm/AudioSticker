// Panel flotante dentro de WhatsApp Web (Shadow DOM para no mezclar estilos).
(() => {
  const S = (window.Sonistick = window.Sonistick || {});
  if (S.panel) return;

  const CSS = `
  :host { all: initial; }
  * { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .wrap { --bg:#ffffff; --fg:#111b21; --muted:#667781; --line:#e2e6e9; --soft:#f3f5f6; --accent:#0b8f6a; --accent-fg:#fff; --warn:#b3261e; --chat:#efeae2;
    position: fixed; top: 16px; right: 16px; width: 400px; max-height: calc(100vh - 32px); overflow: auto;
    background: var(--bg); color: var(--fg); border: 1px solid var(--line); border-radius: 14px;
    box-shadow: 0 12px 40px rgba(0,0,0,.25); z-index: 2147483000; font-size: 13px; }
  @media (prefers-color-scheme: dark) {
    .wrap { --bg:#1f2c34; --fg:#e9edef; --muted:#8696a0; --line:#2f3f48; --soft:#26353e; --accent:#21c08b; --accent-fg:#06281d; --warn:#ff8a80; --chat:#0b141a; }
  }
  .hidden { display: none !important; }
  header { display:flex; align-items:center; gap:8px; padding: 12px 14px; border-bottom: 1px solid var(--line); position: sticky; top:0; background: var(--bg); z-index: 2; }
  header b { font-size: 15px; flex: 1; }
  header small { color: var(--muted); font-weight: 400; margin-left: 4px; }
  .x { border:0; background:transparent; color:var(--muted); font-size:20px; cursor:pointer; line-height:1; }
  .tabs { display:flex; gap:4px; padding: 10px 14px 0; }
  .tab { flex:1; padding:8px 4px; border:1px solid var(--line); background:var(--soft); color:var(--fg); border-radius:8px; cursor:pointer; font-size:12px; }
  .tab.on { background: var(--accent); color: var(--accent-fg); border-color: var(--accent); font-weight:600; }
  section { padding: 10px 14px; }
  h4 { margin: 12px 0 6px; font-size: 11.5px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); }
  label.file { display:block; padding: 10px; border: 1.5px dashed var(--line); border-radius: 10px; text-align:center; cursor:pointer; color: var(--muted); overflow:hidden; text-overflow: ellipsis; white-space: nowrap; }
  label.file:hover { border-color: var(--accent); color: var(--fg); }
  label.file input { display:none; }
  .media { width:100%; max-height: 180px; background: #000; border-radius: 8px; margin-top: 8px; display:block; object-fit: contain; }
  .row { display:flex; align-items:center; gap:8px; margin: 6px 0; flex-wrap: wrap; }
  .row input[type=range] { flex:1; accent-color: var(--accent); min-width: 80px; }
  .grow { flex: 1; }
  .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .grid label, label.field { display:flex; flex-direction:column; gap:3px; color: var(--muted); font-size:12px; }
  select, input[type=text] { width:100%; padding:7px 8px; border:1px solid var(--line); border-radius:8px; background: var(--soft); color: var(--fg); font-size: 13px; }
  input[type=color] { width: 36px; height: 30px; border: 1px solid var(--line); border-radius: 6px; padding: 0; background: none; }
  label.check { display:flex; align-items:center; gap:8px; color: var(--fg); cursor: pointer; }
  label.check input { accent-color: var(--accent); width: 16px; height: 16px; }
  button.btn { padding: 9px 12px; border-radius: 9px; border: 1px solid var(--line); background: var(--soft); color: var(--fg); cursor:pointer; font-size: 13px; }
  button.btn.primary { background: var(--accent); color: var(--accent-fg); border-color: var(--accent); font-weight: 600; }
  button.btn:disabled { opacity:.5; cursor: default; }
  button.btn.on { outline: 2px solid var(--accent); }
  .full { width: 100%; }
  .small { font-size: 12px; padding: 5px 8px; }
  .tiny { font-size: 12px; padding: 3px 7px; min-width: 28px; }
  .hint { color: var(--muted); font-size: 12px; margin: 4px 0; }
  .err { color: var(--warn); font-size: 12.5px; margin: 6px 0; white-space: pre-wrap; }
  .bar { height: 6px; background: var(--soft); border-radius: 3px; overflow: hidden; margin-top: 6px; }
  .bar i { display:block; height:100%; width:0; background: var(--accent); transition: width .15s; }
  canvas.tl { width: 100%; height: 64px; display:block; border-radius: 8px; margin-top: 8px; --accent: inherit; }
  canvas.tl.wave { height: 52px; }
  .times { display:flex; justify-content: space-between; align-items:center; gap: 6px; font-variant-numeric: tabular-nums; font-size: 12px; margin-top: 6px; }
  .times span { display:flex; align-items:center; gap: 4px; }
  details.box { margin-top: 8px; border: 1px solid var(--line); border-radius: 10px; padding: 8px 10px; }
  details.box summary { cursor: pointer; color: var(--muted); }
  details.box[open] summary { margin-bottom: 8px; }
  details.box > input, details.box .grid { margin-bottom: 8px; }
  .design { display:flex; gap: 12px; align-items: flex-start; }
  .stage { width: 168px; height: 168px; flex: none; border-radius: 10px; border: 1px solid var(--line); touch-action: none; cursor: grab;
    background: repeating-conic-gradient(#d9d9d9 0 25%, #fff 0 50%) 0 0/14px 14px; }
  .stage.pick { cursor: crosshair; }
  .controls { flex: 1; min-width: 0; }
  .swatch { width: 22px; height: 22px; border-radius: 50%; border: 1px solid var(--line); flex: none; }
  .chat { background: var(--chat); border-radius: 12px; padding: 14px; display:flex; justify-content: flex-end; position: relative; }
  .chat img { width: 170px; height: 170px; display:block; }
  .chat .play { position:absolute; left: 14px; bottom: 14px; }
  .stats { color: var(--muted); font-size: 12px; line-height: 1.6; margin-top: 8px; }
  .actions { display:grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
  .actions .wide { grid-column: 1 / -1; }
  .hist { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 8px; }
  .hitem { min-width: 0; border: 1px solid var(--line); border-radius: 10px; padding: 6px; display:flex; flex-direction:column; gap: 4px; background: var(--soft); }
  .hitem img { width: 100%; aspect-ratio: 1; object-fit: contain; border-radius: 6px; background: var(--chat); cursor: pointer; }
  .hitem .lbl { font-size: 11px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hitem .btns { display:flex; gap: 4px; }
  .hitem .btns button { flex: 1; min-width: 0; padding: 4px 0; }
  `;

  const timeRow = (k) => `
    <div class="times">
      <span>Inicio <button class="btn tiny" data-nudge="${k}:a:-0.1">−</button><b data-o="${k}a">0.00</b><button class="btn tiny" data-nudge="${k}:a:0.1">+</button></span>
      <span class="hint" data-o="${k}len"></span>
      <span>Fin <button class="btn tiny" data-nudge="${k}:z:-0.1">−</button><b data-o="${k}z">0.00</b><button class="btn tiny" data-nudge="${k}:z:0.1">+</button></span>
    </div>`;

  const HTML = `
  <div class="wrap hidden" part="panel">
    <header><b>Sonistick<small>stickers con sonido</small></b><button class="x" data-act="close" title="Cerrar">×</button></header>
    <div class="tabs">
      <button class="tab on" data-tab="video">Video</button>
      <button class="tab" data-tab="image">Imagen o GIF + audio</button>
      <button class="tab" data-tab="hist">Mis stickers</button>
    </div>

    <section data-pane="video">
      <label class="file"><span data-o="vname">Elegir video…</span><input type="file" accept="video/*" data-in="video"></label>
      <details class="box" data-el="yt">
        <summary>…o traerlo de YouTube</summary>
        <input type="text" data-yt="url" placeholder="https://www.youtube.com/watch?v=…">
        <div class="grid">
          <label>Desde (m:ss)<input type="text" data-yt="start" placeholder="0:00"></label>
          <label>Hasta (m:ss)<input type="text" data-yt="end" placeholder="0:05"></label>
        </div>
        <button class="btn full" data-act="ytgo">Traer tramo de YouTube</button>
        <p class="hint">Se abre el video en una pestaña, se graba ese tramo mientras se reproduce (máx. 30 s, se oirá) y vuelve aquí para afinar el recorte.</p>
        <p class="hint" data-el="ytmsg"></p>
      </details>
      <div data-el="vbox" class="hidden">
        <video class="media" data-el="vprev" muted playsinline></video>
        <canvas class="tl" data-el="vtl"></canvas>
        ${timeRow("v")}
        <div class="row"><button class="btn small" data-act="vplay">▶ Ver tramo con sonido</button><span class="hint">Arrastra las asas o el tramo; toca fuera para ver ese momento.</span></div>
      </div>
    </section>

    <section data-pane="image" class="hidden">
      <label class="file"><span data-o="iname">Elegir imagen, GIF, WebP o video (sin su sonido)…</span><input type="file" accept="image/*,video/*" data-in="image"></label>
      <p class="hint hidden" data-el="ianim"></p>
      <h4>Audio</h4>
      <label class="file"><span data-o="aname">Elegir audio (MP3, M4A, OGG, WAV o un video)…</span><input type="file" accept="audio/*,video/*" data-in="audio"></label>
      <div data-el="abox" class="hidden">
        <canvas class="tl wave" data-el="atl"></canvas>
        ${timeRow("a")}
        <div class="row"><button class="btn small" data-act="aplay">▶ Escuchar tramo</button></div>
      </div>
      <div data-el="extendRow" class="hidden">
        <label class="field">Si la animación dura menos que el audio
          <select data-opt="extend">
            <option value="none">Cada uno con su duración</option>
            <option value="loop">Repetir la animación</option>
            <option value="freeze">Quedarse en el último cuadro</option>
          </select>
        </label>
      </div>
    </section>

    <section data-pane="design" class="hidden">
      <h4>Diseño</h4>
      <div class="design">
        <canvas class="stage" width="512" height="512" data-el="stage" title="Arrastra para mover la imagen"></canvas>
        <div class="controls">
          <label class="field">Encuadre
            <select data-look="fit"><option value="contain">Completo</option><option value="cover">Llenar el cuadrado</option></select>
          </label>
          <div class="row"><span class="hint">Zoom</span><input type="range" min="1" max="4" step="0.05" value="1" data-look="zoom"><button class="btn tiny" data-act="center" title="Centrar">⟲</button></div>
          <label class="check"><input type="checkbox" data-look="keyOn"> Quitar color de fondo</label>
          <div data-el="keyBox" class="hidden">
            <div class="row"><button class="btn tiny" data-act="pick">Elegir color</button><span class="swatch" data-el="swatch"></span></div>
            <div class="row"><span class="hint">Tolerancia</span><input type="range" min="0.02" max="0.6" step="0.01" value="0.18" data-look="tol"></div>
          </div>
        </div>
      </div>
      <p class="hint" data-el="stagehint">Arrastra la vista previa para mover la imagen.</p>
      <h4>Texto</h4>
      <div class="grid">
        <label>Arriba<input type="text" data-look="top" maxlength="80" placeholder="(opcional)"></label>
        <label>Abajo<input type="text" data-look="bottom" maxlength="80" placeholder="(opcional)"></label>
      </div>
      <div class="row"><span class="hint">Color</span><input type="color" value="#ffffff" data-look="textColor"><span class="hint">Tamaño</span><input type="range" min="0.08" max="0.24" step="0.01" value="0.14" data-look="textSize"></div>
    </section>

    <section data-pane="format" class="hidden">
      <h4>Formato</h4>
      <div class="grid">
        <label>Fluidez<select data-opt="fps"><option>10</option><option selected>15</option><option>20</option><option>25</option><option>30</option></select></label>
        <label>Animación<select data-opt="loop"><option value="1" selected>Una vez</option><option value="0">En bucle</option></select></label>
        <label>Volumen extra<select data-opt="gain"><option value="0.5">50 %</option><option value="0.75">75 %</option><option value="1" selected>100 %</option><option value="1.5">150 %</option><option value="2">200 %</option></select></label>
        <label>Emoji<input type="text" data-opt="emoji" value="🔊" maxlength="8"></label>
        <label>Paquete<input type="text" data-opt="pack" placeholder="Sonistick" maxlength="60"></label>
        <label>Autor<input type="text" data-opt="author" placeholder="(opcional)" maxlength="60"></label>
      </div>
      <div class="row"><label class="check"><input type="checkbox" data-opt="normalize" checked> Normalizar volumen (que no suene ni muy bajo ni muy fuerte)</label></div>
      <p class="hint">Se ajusta solo para quedar bajo 1 MB: si el tramo es largo, baja la resolución o los fps.</p>
      <button class="btn primary full" data-act="create" disabled>Crear sticker</button>
      <div data-el="prog" class="hidden"><p class="hint" data-o="stage"></p><div class="bar"><i data-el="barfill"></i></div></div>
      <p class="err hidden" data-el="err"></p>
    </section>

    <section data-pane="hist" class="hidden">
      <label class="check"><input type="checkbox" data-hist="enabled"> Guardar los stickers que cree</label>
      <div class="row"><span class="hint">Guardar como máximo</span><select data-hist="max" style="width:auto"><option>10</option><option selected>25</option><option>50</option></select><span class="hint grow" data-o="histUsage"></span></div>
      <p class="hint">Se guardan en el almacenamiento de la extensión, solo en este navegador. Cada sticker ocupa entre 0,2 y 1 MB.</p>
      <div class="hist" data-el="histList"></div>
      <p class="hint" data-el="histEmpty">Todavía no hay stickers guardados.</p>
      <button class="btn small" data-act="histClear">Borrar todo el historial</button>
      <p class="err hidden" data-el="histErr"></p>
    </section>

    <section data-el="result" class="hidden">
      <h4>Vista previa <span data-o="rlabel"></span></h4>
      <div class="chat">
        <img data-el="rimg" alt="Vista previa del sticker">
        <button class="btn small play" data-act="rplay">▶ Reproducir con sonido</button>
      </div>
      <div class="stats" data-el="rstats"></div>
      <div class="actions">
        <button class="btn primary" data-act="sendActive">Enviar al chat abierto</button>
        <button class="btn" data-act="sendSelf">Enviármelo a mí</button>
        <button class="btn wide small" data-act="download">Descargar archivos (.webp + .ogg)</button>
      </div>
      <p class="hint" data-el="sendmsg"></p>
    </section>
  </div>`;

  const fmt = (t) => (isFinite(t) ? t.toFixed(2) : "–");
  const kb = (n) => (n / 1024).toFixed(0) + " KB";
  const mb = (n) => (n / 1048576).toFixed(1) + " MB";

  function mount() {
    const host = document.createElement("div");
    host.id = "sonistick-root";
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${CSS}</style>${HTML}`;
    document.documentElement.appendChild(host);

    const q = (sel) => root.querySelector(sel);
    const el = (n) => q(`[data-el="${n}"]`);
    const out = (n) => q(`[data-o="${n}"]`);
    const opt = (n) => q(`[data-opt="${n}"]`);
    const lk = (n) => q(`[data-look="${n}"]`);
    const act = (n) => q(`[data-act="${n}"]`);
    const pane = (n) => q(`[data-pane="${n}"]`);
    const wrap = q(".wrap");

    const st = {
      tab: "video", busy: false, result: null,
      video: null, videoDur: 0, videoAudio: null,
      image: null, imageInfo: null, imageBmp: null,
      audio: null, audioDecoded: null,
      look: S.defaultLook(), picking: false,
    };

    function show(node, on) { node.classList.toggle("hidden", !on); }
    function setError(msg) { el("err").textContent = msg || ""; show(el("err"), !!msg); }
    function sourceReady() { return st.tab === "video" ? !!st.videoDur : st.tab === "image" ? !!st.imageInfo : false; }
    function refresh() {
      const ready = sourceReady();
      show(pane("design"), ready);
      show(pane("format"), st.tab !== "hist");
      act("create").disabled = !ready || (st.tab === "image" && !st.audioDecoded) || st.busy;
      if (ready) drawStage();
    }

    // ---------- pestañas
    root.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => {
      st.tab = b.dataset.tab;
      root.querySelectorAll(".tab").forEach((x) => x.classList.toggle("on", x === b));
      for (const p of ["video", "image", "hist"]) show(pane(p), p === st.tab);
      if (st.tab === "hist") renderHistory();
      refresh();
    }));

    // ---------- líneas de tiempo
    function bindTimes(key, tl) {
      root.querySelectorAll(`[data-nudge^="${key}:"]`).forEach((b) => b.addEventListener("click", () => {
        const [, which, d] = b.dataset.nudge.split(":");
        tl.nudge(which, +d);
      }));
      return (a, z) => {
        out(key + "a").textContent = fmt(a);
        out(key + "z").textContent = fmt(z);
        out(key + "len").textContent = "Duración " + fmt(z - a) + " s";
      };
    }

    // Video
    const vprev = el("vprev");
    let vStopAt = null;
    let updV;
    const vtl = S.Timeline(el("vtl"), {
      onChange: (a, z, kind) => {
        updV(a, z);
        if (kind === "a" || kind === "move") seekPreview(a);
        else if (kind === "z") seekPreview(z);
      },
      onSeek: (t) => seekPreview(t),
    });
    updV = bindTimes("v", vtl);
    function seekPreview(t) { vprev.pause(); vStopAt = null; vprev.currentTime = t; }
    vprev.addEventListener("timeupdate", () => {
      vtl.setPlayhead(vprev.currentTime);
      if (vStopAt != null && vprev.currentTime >= vStopAt) { vprev.pause(); vStopAt = null; }
    });
    vprev.addEventListener("seeked", () => { vtl.setPlayhead(vprev.currentTime); drawStage(); });
    act("vplay").addEventListener("click", () => {
      const [a, z] = vtl.range;
      vprev.muted = false;
      vprev.currentTime = a;
      vStopAt = z;
      vprev.play();
    });

    async function videoThumbs(file, dur, n = 10) {
      const v = document.createElement("video");
      v.muted = true;
      v.src = URL.createObjectURL(file);
      const out = [];
      try {
        await new Promise((r, j) => { v.onloadeddata = r; v.onerror = j; });
        for (let i = 0; i < n; i++) {
          v.currentTime = Math.min(dur - 0.05, ((i + 0.5) / n) * dur);
          await new Promise((r) => { v.onseeked = r; setTimeout(r, 3000); });
          out.push(await createImageBitmap(v, { resizeWidth: 120, resizeQuality: "medium" }));
        }
      } catch (e) { /* sin miniaturas */ }
      URL.revokeObjectURL(v.src);
      return out;
    }

    q('[data-in="video"]').addEventListener("change", (ev) => { if (ev.target.files[0]) loadVideo(ev.target.files[0]); });
    async function loadVideo(f, { fullRange = false } = {}) {
      setError("");
      st.video = f;
      st.videoDur = 0;
      out("vname").textContent = f.name;
      if (vprev.src) URL.revokeObjectURL(vprev.src);
      vprev.src = URL.createObjectURL(f);
      show(el("vbox"), true);
      await new Promise((r) => { vprev.onloadeddata = r; vprev.onerror = r; });
      let dur;
      try { dur = await S.videoDuration(vprev, f); } catch (e) { dur = NaN; }
      if (!isFinite(dur) || !dur) { show(el("vbox"), false); setError("No se pudo leer ese video. Prueba con MP4 o WebM."); refresh(); return; }
      st.videoDur = dur;
      const decoded = await S.decodeAudio(f);
      st.videoAudio = decoded;
      vtl.setSource({ duration: dur, peaks: decoded ? S.peaks(decoded.samples, 200) : null });
      vtl.setRange(0, fullRange ? dur : Math.min(dur, 5));
      st.look = { ...S.defaultLook(), ...pickLookText() };
      syncLookInputs();
      refresh();
      if (!decoded) setError("Ese video no tiene sonido. Usa la pestaña «Imagen o GIF + audio» para ponerle uno.");
      videoThumbs(f, dur).then((t) => { if (st.video === f) vtl.setThumbs(t); });
    }

    // Audio
    const audioEl = new Audio();
    let aStopAt = null;
    let updA;
    const atl = S.Timeline(el("atl"), {
      onChange: (a, z) => updA(a, z),
      onSeek: (t) => { audioEl.currentTime = t; audioEl.play(); aStopAt = vrangeEnd(); },
    });
    const vrangeEnd = () => atl.range[1];
    updA = bindTimes("a", atl);
    audioEl.addEventListener("timeupdate", () => {
      atl.setPlayhead(audioEl.currentTime);
      if (aStopAt != null && audioEl.currentTime >= aStopAt) { audioEl.pause(); aStopAt = null; }
    });
    act("aplay").addEventListener("click", () => {
      const [a, z] = atl.range;
      audioEl.currentTime = a;
      aStopAt = z;
      audioEl.play();
    });

    q('[data-in="audio"]').addEventListener("change", async (ev) => {
      const f = ev.target.files[0];
      if (!f) return;
      setError("");
      st.audio = f;
      st.audioDecoded = null;
      out("aname").textContent = f.name;
      const d = await S.decodeAudio(f);
      if (!d) { setError("No se encontró audio en ese archivo."); show(el("abox"), false); refresh(); return; }
      st.audioDecoded = d;
      if (audioEl.src) URL.revokeObjectURL(audioEl.src);
      audioEl.src = URL.createObjectURL(f);
      show(el("abox"), true);
      atl.setSource({ duration: d.duration, peaks: S.peaks(d.samples, 200) });
      const defEnd = st.imageInfo && st.imageInfo.kind !== "still" ? Math.max(st.imageInfo.duration, 1) : 5;
      atl.setRange(0, Math.min(d.duration, defEnd));
      refresh();
    });

    // Imagen
    q('[data-in="image"]').addEventListener("change", async (ev) => {
      const f = ev.target.files[0];
      if (!f) return;
      setError("");
      st.image = null;
      st.imageInfo = null;
      out("iname").textContent = f.name;
      try {
        const v = await S.openVisual(f);
        const first = await v.frameAt(0);
        if (st.imageBmp) st.imageBmp.close();
        st.imageBmp = await createImageBitmap(first);
        st.imageInfo = { kind: v.kind, duration: v.duration, width: v.width, height: v.height };
        v.close();
        st.image = f;
      } catch (e) {
        setError(e.message);
      }
      const anim = st.imageInfo && st.imageInfo.kind !== "still";
      el("ianim").textContent = anim ? `Animación de ${fmt(st.imageInfo.duration)} s.` : "Imagen fija: el sticker dura lo que el audio.";
      show(el("ianim"), !!st.imageInfo);
      show(el("extendRow"), !!anim);
      st.look = { ...S.defaultLook(), ...pickLookText() };
      syncLookInputs();
      refresh();
    });

    // ---------- diseño
    const stage = el("stage");
    const sctx = stage.getContext("2d", { willReadFrequently: true });
    function previewSource() {
      if (st.tab === "video" && st.videoDur && vprev.videoWidth) return { img: vprev, w: vprev.videoWidth, h: vprev.videoHeight };
      if (st.tab === "image" && st.imageBmp) return { img: st.imageBmp, w: st.imageBmp.width, h: st.imageBmp.height };
      return null;
    }
    let stageQueued = false;
    function drawStage() {
      if (stageQueued) return;
      stageQueued = true;
      requestAnimationFrame(() => {
        stageQueued = false;
        const src = previewSource();
        if (!src) { sctx.clearRect(0, 0, 512, 512); return; }
        S.drawFrame(sctx, src.img, src.w, src.h, 512, st.look);
      });
    }
    function pickLookText() { return { top: lk("top").value, bottom: lk("bottom").value, textColor: lk("textColor").value, textSize: +lk("textSize").value }; }
    function syncLookInputs() {
      lk("fit").value = st.look.fit;
      lk("zoom").value = st.look.zoom;
      lk("keyOn").checked = !!st.look.key;
      show(el("keyBox"), !!st.look.key);
    }
    lk("fit").addEventListener("change", () => { st.look.fit = lk("fit").value; st.look.panX = st.look.panY = 0; drawStage(); });
    lk("zoom").addEventListener("input", () => { st.look.zoom = +lk("zoom").value; drawStage(); });
    act("center").addEventListener("click", () => { st.look.zoom = 1; st.look.panX = st.look.panY = 0; syncLookInputs(); drawStage(); });
    for (const k of ["top", "bottom", "textColor", "textSize"]) lk(k).addEventListener("input", () => { Object.assign(st.look, pickLookText()); drawStage(); });
    lk("keyOn").addEventListener("change", () => {
      if (lk("keyOn").checked) {
        st.look.key = { r: 255, g: 255, b: 255, tol: +lk("tol").value };
        // Color de fondo más probable: el de la esquina superior izquierda.
        const src = previewSource();
        if (src) {
          const c = new OffscreenCanvas(512, 512).getContext("2d", { willReadFrequently: true });
          S.drawFrame(c, src.img, src.w, src.h, 512, { ...st.look, key: null, top: "", bottom: "" });
          const p = c.getImageData(6, 6, 1, 1).data;
          if (p[3] > 0) Object.assign(st.look.key, { r: p[0], g: p[1], b: p[2] });
        }
        setPicking(true);
      } else {
        st.look.key = null;
        setPicking(false);
      }
      updateSwatch();
      show(el("keyBox"), !!st.look.key);
      drawStage();
    });
    lk("tol").addEventListener("input", () => { if (st.look.key) { st.look.key.tol = +lk("tol").value; drawStage(); } });
    act("pick").addEventListener("click", () => setPicking(!st.picking));
    function setPicking(on) {
      st.picking = on;
      stage.classList.toggle("pick", on);
      act("pick").classList.toggle("on", on);
      el("stagehint").textContent = on ? "Toca en la vista previa el color que quieres quitar." : "Arrastra la vista previa para mover la imagen.";
    }
    function updateSwatch() {
      const k = st.look.key;
      el("swatch").style.background = k ? `rgb(${k.r},${k.g},${k.b})` : "transparent";
    }

    let drag = null;
    stage.addEventListener("pointerdown", (ev) => {
      const src = previewSource();
      if (!src) return;
      const r = stage.getBoundingClientRect();
      const px = ((ev.clientX - r.left) / r.width) * 512, py = ((ev.clientY - r.top) / r.height) * 512;
      if (st.picking && st.look.key) {
        const c = new OffscreenCanvas(512, 512).getContext("2d", { willReadFrequently: true });
        S.drawFrame(c, src.img, src.w, src.h, 512, { ...st.look, key: null, top: "", bottom: "" });
        const p = c.getImageData(Math.floor(px), Math.floor(py), 1, 1).data;
        if (p[3] > 0) Object.assign(st.look.key, { r: p[0], g: p[1], b: p[2] });
        updateSwatch();
        setPicking(false);
        drawStage();
        return;
      }
      const rect = S.placeRect(src.w, src.h, 512, st.look);
      drag = { x: ev.clientX, y: ev.clientY, panX: st.look.panX, panY: st.look.panY, rw: rect.w, rh: rect.h, scale: 512 / r.width };
      stage.setPointerCapture(ev.pointerId);
    });
    stage.addEventListener("pointermove", (ev) => {
      if (!drag) return;
      const dx = (ev.clientX - drag.x) * drag.scale, dy = (ev.clientY - drag.y) * drag.scale;
      // x = (512 - w)/2 * (1 + pan)  →  d(pan) = dx / ((512 - w)/2)
      const hx = (512 - drag.rw) / 2, hy = (512 - drag.rh) / 2;
      if (Math.abs(hx) > 1) st.look.panX = Math.max(-1, Math.min(1, drag.panX + dx / hx));
      if (Math.abs(hy) > 1) st.look.panY = Math.max(-1, Math.min(1, drag.panY + dy / hy));
      drawStage();
    });
    const endDrag = () => { drag = null; };
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);

    // ---------- YouTube
    function parseTime(txt) {
      const t = String(txt || "").trim().replace(",", ".");
      if (!t) return NaN;
      const parts = t.split(":").map(Number);
      if (parts.some((n) => !isFinite(n) || n < 0)) return NaN;
      return parts.reduce((acc, n) => acc * 60 + n, 0);
    }
    const mmss = (sec) => Math.floor(sec / 60) + ":" + String(Math.floor(sec % 60)).padStart(2, "0");
    q('[data-yt="url"]').addEventListener("change", () => {
      try {
        const u = new URL(q('[data-yt="url"]').value.trim());
        const t = u.searchParams.get("t") || u.searchParams.get("start");
        if (t && !q('[data-yt="start"]').value) {
          const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
          const sec = m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : NaN;
          if (isFinite(sec)) {
            q('[data-yt="start"]').value = mmss(sec);
            if (!q('[data-yt="end"]').value) q('[data-yt="end"]').value = mmss(sec + 5);
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
        await loadVideo(file, { fullRange: true });
      } catch (e) {
        el("ytmsg").textContent = "";
        setError("YouTube: " + (e.message || e));
      } finally {
        act("ytgo").disabled = false;
      }
    });

    // ---------- crear
    act("create").addEventListener("click", async () => {
      setError("");
      st.busy = true;
      refresh();
      show(el("prog"), true);
      const opts = {
        fps: +opt("fps").value, pack: opt("pack").value.trim(), author: opt("author").value.trim(),
        emoji: opt("emoji").value.trim() || "🔊", gain: +opt("gain").value, loop: +opt("loop").value,
        normalize: opt("normalize").checked, extend: opt("extend").value,
        look: JSON.parse(JSON.stringify(st.look)),
      };
      let label;
      if (st.tab === "video") {
        const [a, z] = vtl.range;
        Object.assign(opts, { visualFile: st.video, audioFile: st.video, vStart: a, vEnd: z, aStart: a, aEnd: z, extend: "none" });
        label = st.video.name;
      } else {
        const [a, z] = atl.range;
        Object.assign(opts, { visualFile: st.image, audioFile: st.audio, vStart: 0, vEnd: st.imageInfo.duration || 0, aStart: a, aEnd: z });
        label = st.image.name;
      }
      label = (opts.look.top || opts.look.bottom || label.replace(/\.[^.]+$/, "")).slice(0, 40);
      try {
        const r = await S.buildSticker(opts, (stage, p) => { out("stage").textContent = stage; el("barfill").style.width = Math.round((p || 0) * 100) + "%"; });
        showResult(r, label);
        try {
          if (await S.history.add(r, label)) el("sendmsg").textContent = "Guardado en «Mis stickers».";
        } catch (e) { console.warn("[Sonistick] historial", e); }
      } catch (e) {
        console.error("[Sonistick]", e);
        setError(e.message || String(e));
      } finally {
        st.busy = false;
        show(el("prog"), false);
        refresh();
      }
    });

    // ---------- resultado
    const raudio = new Audio();
    let rStop = null;
    function showResult(r, label) {
      st.result = r;
      const i = r.info;
      if (el("rimg").src) URL.revokeObjectURL(el("rimg").src);
      if (raudio.src) URL.revokeObjectURL(raudio.src);
      el("rimg").src = URL.createObjectURL(r.webp);
      raudio.src = URL.createObjectURL(r.ogg);
      out("rlabel").textContent = label ? "· " + label : "";
      const sound = i.soundSeconds || i.audioSeconds;
      el("rstats").innerHTML =
        `${i.side}×${i.side} px${i.fps ? " · " + Math.round(i.fps) + " fps" : " · imagen fija"} · sticker ${kb(i.webpBytes)}<br>` +
        `Audio ${sound.toFixed(1)} s · ${kb(i.oggBytes)}` +
        (i.normalizeDb != null ? ` · volumen ${i.normalizeDb >= 0 ? "+" : ""}${i.normalizeDb.toFixed(1)} dB` : "") +
        (i.audioSeconds > sound + 1 ? `<br>Se agregan ${Math.round(i.audioSeconds - sound)} s de silencio y cuadro quieto para que no se repita.` : "");
      el("sendmsg").textContent = "";
      el("sendmsg").classList.remove("err");
      show(el("result"), true);
      el("result").scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    act("rplay").addEventListener("click", () => {
      if (!st.result) return;
      const img = el("rimg");
      const src = img.src;
      img.src = "";
      img.src = src; // reinicia la animación
      raudio.currentTime = 0;
      raudio.play();
      clearTimeout(rStop);
      const sound = st.result.info.soundSeconds || st.result.info.audioSeconds;
      rStop = setTimeout(() => raudio.pause(), sound * 1000 + 300); // no hace falta oír el silencio de relleno
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
    async function send(target, item = st.result) {
      if (!item) return;
      const btns = [act("sendActive"), act("sendSelf")];
      btns.forEach((b) => (b.disabled = true));
      el("sendmsg").classList.remove("err");
      try {
        const name = await S.wa.send(item, target, (m) => (el("sendmsg").textContent = m));
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

    // ---------- historial
    async function renderHistory() {
      show(el("histErr"), false);
      try {
        const s = await S.history.settings();
        q('[data-hist="enabled"]').checked = s.enabled;
        q('[data-hist="max"]').value = String(s.max);
        const idx = await S.history.index();
        const list = el("histList");
        list.replaceChildren();
        for (const it of idx) {
          const d = document.createElement("div");
          d.className = "hitem";
          d.innerHTML = `<img alt=""><div class="lbl"></div><div class="btns"><button class="btn tiny" data-h="open" title="Abrir y probar">▶</button><button class="btn tiny" data-h="send" title="Enviar al chat abierto">➤</button><button class="btn tiny" data-h="del" title="Borrar">🗑</button></div>`;
          if (it.thumb) d.querySelector("img").src = it.thumb;
          d.querySelector(".lbl").textContent = it.label + " · " + new Date(it.created).toLocaleDateString();
          d.querySelector(".lbl").title = it.label;
          const open = async () => { const e = await S.history.get(it.id); showResult(e, it.label); return e; };
          d.querySelector("img").addEventListener("click", () => open().catch(histError));
          d.querySelector('[data-h="open"]').addEventListener("click", () => open().catch(histError));
          d.querySelector('[data-h="send"]').addEventListener("click", async () => { try { await send("active", await open()); } catch (e) { histError(e); } });
          d.querySelector('[data-h="del"]').addEventListener("click", async () => { await S.history.remove(it.id).catch(histError); renderHistory(); });
          list.appendChild(d);
        }
        show(el("histEmpty"), !idx.length);
        const bytes = await S.history.bytesInUse().catch(() => null);
        out("histUsage").textContent = idx.length ? `${idx.length} guardados${bytes != null ? " · " + mb(bytes) : ""}` : "";
      } catch (e) { histError(e); }
    }
    function histError(e) { el("histErr").textContent = e.message || String(e); show(el("histErr"), true); }
    async function saveHistSettings() {
      try {
        await S.history.saveSettings({ enabled: q('[data-hist="enabled"]').checked, max: +q('[data-hist="max"]').value });
        renderHistory();
      } catch (e) { histError(e); }
    }
    q('[data-hist="enabled"]').addEventListener("change", saveHistSettings);
    q('[data-hist="max"]').addEventListener("change", saveHistSettings);
    act("histClear").addEventListener("click", async () => {
      if (!confirm("¿Borrar todos los stickers guardados?")) return;
      await S.history.clear().catch(histError);
      renderHistory();
    });

    act("close").addEventListener("click", () => api.hide());

    // Evita que WhatsApp capture las teclas mientras se escribe en el panel.
    for (const t of ["keydown", "keyup", "keypress", "paste"]) host.addEventListener(t, (e) => e.stopPropagation());

    const api = {
      show() { show(wrap, true); requestAnimationFrame(() => { vtl.redraw(); atl.redraw(); }); },
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
