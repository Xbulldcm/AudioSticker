// Graba un tramo de un video de YouTube. Se inyecta en la pestaña de YouTube (mundo MAIN)
// desde background.js con chrome.scripting.executeScript, así que debe ser autocontenido.
async function sonistickRecordYouTube(start, end) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const until = async (fn, ms, what) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { const v = fn(); if (v) return v; await sleep(200); }
    throw new Error("Tiempo agotado: " + what);
  };

  const player = await until(() => document.querySelector("#movie_player"), 30000, "no apareció el reproductor de YouTube");
  const video = await until(() => player.querySelector("video"), 30000, "no apareció el video");
  await until(() => video.readyState >= 2, 30000, "el video no cargó");

  // Esperar a que terminen los anuncios (si hay botón de saltar, pulsarlo).
  const adStart = Date.now();
  while (player.classList.contains("ad-showing") || player.classList.contains("ad-interrupting")) {
    const skip = document.querySelector(".ytp-skip-ad-button, .ytp-ad-skip-button, .ytp-ad-skip-button-modern");
    if (skip) skip.click();
    if (Date.now() - adStart > 120000) throw new Error("El anuncio no terminó");
    await sleep(300);
  }
  await until(() => isFinite(video.duration) && video.duration > 0, 20000, "duración desconocida");
  if (start >= video.duration) throw new Error("El inicio está después del final del video (" + Math.floor(video.duration) + " s)");
  end = Math.min(end, video.duration);

  const prev = { muted: video.muted, volume: video.volume };
  video.pause();
  video.muted = false;
  video.volume = 1;
  for (let i = 0; i < 3 && Math.abs(video.currentTime - start) > 0.5; i++) {
    video.currentTime = start;
    await Promise.race([new Promise((r) => video.addEventListener("seeked", r, { once: true })), sleep(8000)]);
  }
  if (Math.abs(video.currentTime - start) > 0.5) throw new Error("No se pudo ir al segundo " + start + " del video");
  await until(() => video.readyState >= 3, 20000, "el video no cargó en el inicio");

  const stream = video.captureStream();
  await until(() => stream.getVideoTracks().length > 0, 5000, "no se pudo capturar la imagen");
  const types = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  const mimeType = types.find((t) => MediaRecorder.isTypeSupported(t));
  const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6000000, audioBitsPerSecond: 128000 });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stopped = new Promise((r) => (rec.onstop = r));

  rec.start(250);
  await video.play();
  const playStart = Date.now();
  const limitMs = (end - start) * 1000 + 30000;
  while (video.currentTime < end && !video.ended) {
    if (Date.now() - playStart > limitMs) break; // el video se trabó: guardar lo que haya
    if (video.paused && !player.classList.contains("ad-showing")) await video.play().catch(() => {});
    await sleep(30);
  }
  rec.stop();
  video.pause();
  await stopped;
  stream.getTracks().forEach((t) => t.stop());
  video.muted = prev.muted;
  video.volume = prev.volume;

  const blob = new Blob(chunks, { type: "video/webm" });
  if (blob.size < 1000) throw new Error("La grabación salió vacía");
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  const title = (document.title || "youtube").replace(/ - YouTube$/, "");
  return { b64: btoa(bin), mime: "video/webm", title, seconds: end - start };
}
