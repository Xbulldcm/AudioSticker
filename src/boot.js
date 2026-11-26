// Arranque dentro de WhatsApp Web: botón flotante y activación local de stickers con sonido.
(() => {
  const S = window.Sonistick;
  if (!S || S._booted) return;
  S._booted = true;

  const btn = document.createElement("button");
  btn.id = "sonistick-launcher";
  btn.title = "Sonistick: crear sticker con sonido";
  btn.textContent = "🔊";
  Object.assign(btn.style, {
    position: "fixed", left: "14px", bottom: "14px", zIndex: 2147482999, width: "42px", height: "42px",
    borderRadius: "50%", border: "0", background: "#0b8f6a", color: "#fff", fontSize: "20px",
    cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,.3)",
  });
  btn.addEventListener("click", () => S.panel.toggle());
  document.documentElement.appendChild(btn);

  // Cuando WhatsApp termine de cargar, activar la función para que se vean y suenen los stickers con sonido.
  const t0 = Date.now();
  const timer = setInterval(() => {
    if (S.wa.ready()) {
      clearInterval(timer);
      setTimeout(() => S.wa.enableSoundStickers(), 5000);
    } else if (Date.now() - t0 > 180000) {
      clearInterval(timer);
    }
  }, 1000);
})();
