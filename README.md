# Sonistick: stickers con sonido para WhatsApp Web

Extensión para Chrome, Edge o Brave que convierte un **video**, una **imagen** o un **GIF** en un **sticker con sonido** y lo envía desde WhatsApp Web. Todo se procesa en tu navegador.

> Proyecto personal y **no oficial**, sin relación con WhatsApp ni Meta. Usa partes internas de WhatsApp Web que pueden cambiar en cualquier momento, y activa solo en tu navegador la función de stickers con sonido que WhatsApp está probando. Úsalo bajo tu responsabilidad.

## Instalar

1. Descarga o clona este repositorio (por ejemplo en `C:\GitHub\AudioSticker`).
2. Abre `chrome://extensions` (en Edge, `edge://extensions`).
3. Activa **Modo de desarrollador**.
4. Pulsa **Cargar extensión sin empaquetar** y elige la carpeta que contiene `manifest.json`.
5. Fija el icono verde en la barra del navegador.

Para actualizar: reemplaza los archivos y pulsa ↻ en la tarjeta de la extensión. Después recarga WhatsApp Web (F5).

## Usar

1. Abre [web.whatsapp.com](https://web.whatsapp.com) y entra al chat donde quieres mandarlo.
2. Pulsa el icono de la extensión o el botón 🔊 de abajo a la izquierda.
3. Elige una pestaña:
   - **Video con sonido:** eliges un video y marcas el tramo con *Inicio* y *Fin*. También puedes abrir **…o traerlo de YouTube**, pegar el link y escribir desde y hasta qué segundo (por ejemplo `1:05` a `1:12`, máximo 30 s).
   - **Imagen o GIF + audio:** una imagen fija, GIF, WebP animado o video sin su sonido, más un audio aparte (MP3, M4A, OGG, WAV o el sonido de otro video), con su propio tramo. Si la animación es más corta que el audio, puedes repetirla o dejarla quieta en el último cuadro.
4. Ajusta fluidez (fps), encuadre, paquete, autor, emoji y volumen, y pulsa **Crear sticker**.
5. Revisa la vista previa con **Probar con sonido** y pulsa **Enviar al chat abierto** o **Enviármelo a mí**. También puedes **descargar** el `.webp` y el `.ogg`.

Quien lo recibe necesita una versión de WhatsApp que ya reproduzca stickers con sonido; si no, verá un aviso de mensaje no compatible.

## Videos de YouTube

La extensión no descarga el video: abre el link en una pestaña de YouTube, espera a que terminen los anuncios, va al segundo de inicio y **graba el tramo en tiempo real** mientras se reproduce (se oye mientras graba). Al terminar cierra esa pestaña y vuelve a WhatsApp Web con el tramo cargado para que lo recortes y crees el sticker.

- Tarda lo que dure el tramo, más unos segundos de carga.
- No sirve con videos privados, con restricción de edad sin sesión iniciada, ni con contenido protegido (por ejemplo, películas de pago).
- Respeta los derechos de autor y las condiciones de YouTube: úsalo solo con contenido que puedas compartir.

## Límites

| | Límite |
|---|---|
| Sticker (.webp) | 1 MB. Si no cabe, la extensión baja calidad, resolución (512 → 128 px) y fps sola. |
| Audio (.ogg Opus) | 1 MB (minutos de audio a 32 kbps). |
| Navegador | Chrome, Edge o Brave de escritorio actualizado (usa WebCodecs). No funciona en Firefox ni en Safari. |

## Cómo funciona

Un sticker con sonido son dos archivos en un mismo mensaje:

- un **WebP animado** (lienzo cuadrado, transparente) cuyo EXIF lleva el JSON de stickers de WhatsApp con `sound-sha256`, el SHA-256 del audio;
- un **audio Ogg/Opus** mono a 48 kHz que se sube aparte, como una nota de voz.

Partes del código:

| Archivo | Qué hace |
|---|---|
| `src/core/audio.js` | Decodifica el audio, recorta con fundido de 8 ms, lo pasa a mono 48 kHz y lo codifica a Opus con `AudioEncoder`. |
| `src/core/ogg.js` | Empaqueta los paquetes Opus en Ogg (OpusHead, OpusTags, páginas con CRC). |
| `src/core/frames.js` | Abre la fuente (video, GIF/WebP/APNG con `ImageDecoder`, imagen fija) y captura los cuadros del tramo. |
| `src/core/webp.js` | Arma el WebP animado (VP8X, ANIM, ANMF, EXIF) a partir de los cuadros que codifica el canvas. |
| `src/core/build.js` | Une todo y busca la mejor combinación de resolución, calidad y fps que quepa en 1 MB. Fusiona cuadros repetidos. |
| `src/wa/whatsapp.js` | Habla con WhatsApp Web: activa la función localmente, sube el audio y envía el sticker con el audio enlazado. |
| `src/ui/panel.js` | Panel flotante (Shadow DOM). |
| `src/youtube.js`, `src/yt-client.js`, `src/bridge.js` | Grabación de tramos de YouTube: el fondo abre la pestaña y graba con `captureStream` + `MediaRecorder`; el puente pasa el resultado a WhatsApp Web. |
| `dev/` | Páginas para probar la conversión y el panel sin WhatsApp (ábrelas con un servidor local o directamente en Chrome). |

## Si algo falla

- **No aparece el panel:** recarga WhatsApp Web (F5); las pestañas abiertas antes de instalar no tienen la extensión.
- **«No se pudo enviar…»:** WhatsApp pudo haber cambiado sus módulos internos. Abre la consola (F12) y busca mensajes `[Sonistick]`.
- **El sticker llega sin sonido:** tu cuenta o la de quien lo recibe puede no tener aún la función. Prueba con **Enviármelo a mí** y ábrelo en el celular.
