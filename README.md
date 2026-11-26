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
2. Pulsa el icono de la extensión o el botón 🔊 de abajo a la izquierda. Pasa el ratón por los íconos ⓘ para ver qué hace cada opción.
3. Elige una pestaña:
   - **Video:** eliges un video (o lo traes de YouTube) y marcas el tramo en la línea de tiempo, que muestra miniaturas y la forma de onda. Arrastra las asas, o el tramo entero; los botones − y + mueven 0,1 s.
   - **Imagen o GIF + audio:** una imagen fija, GIF, WebP animado o video sin su sonido, más un audio aparte con su propia línea de tiempo. Si la animación es más corta que el audio, puedes repetirla o dejarla quieta en el último cuadro.
   - **Mis stickers:** el historial (ver abajo).
4. En **Diseño** ajustas cómo se ve, con vista previa al momento:
   - **Encuadre** completo o llenando el cuadrado, **zoom**, y arrastrar la vista previa para mover la imagen.
   - **Quitar color de fondo:** vuelve transparente un color (por ejemplo un fondo blanco o verde). Pulsa *Elegir color* y toca ese color en la vista previa; ajusta la tolerancia.
   - **Texto** arriba y abajo, estilo meme, con color y tamaño.
5. En **Formato**: fluidez (fps), animación *Una vez* o *En bucle*, **normalizar volumen** (activado por defecto), volumen extra, emoji, paquete y autor. Pulsa **Crear sticker**.
6. En la **vista previa** pulsa *Reproducir con sonido* para verlo y oírlo juntos. Luego **Enviar al chat abierto**, **Enviármelo a mí** o **Descargar**.

Quien lo recibe necesita una versión de WhatsApp que ya reproduzca stickers con sonido; si no, verá un aviso de mensaje no compatible.

## Historial (Mis stickers)

Está **apagado por defecto**. Actívalo en la pestaña *Mis stickers* con *Guardar los stickers que cree* y elige cuántos guardar (10, 25 o 50; al pasar el límite se borran los más viejos). Se guardan en el almacenamiento de la extensión, solo en este navegador y no en WhatsApp, así que no se pierden al cerrar sesión. Cada sticker ocupa entre 0,2 y 1 MB. Desde ahí puedes abrirlos para probarlos, reenviarlos, descargarlos, borrarlos uno a uno o borrar todo.

## Videos de YouTube

La extensión no descarga el video: abre el link en una pestaña de YouTube, espera a que terminen los anuncios, va al segundo de inicio y **graba el tramo en tiempo real** mientras se reproduce (se oye mientras graba). Al terminar cierra esa pestaña y vuelve a WhatsApp Web con el tramo cargado para que lo recortes y crees el sticker.

- Tarda lo que dure el tramo, más unos segundos de carga.
- No sirve con videos privados, con restricción de edad sin sesión iniciada, ni con contenido protegido (por ejemplo, películas de pago).
- Respeta los derechos de autor y las condiciones de YouTube: úsalo solo con contenido que puedas compartir.

## Animación "Una vez" o "En bucle"

WhatsApp no respeta el número de repeticiones guardado en el sticker: repite los stickers animados por su cuenta. WhatsApp tampoco respeta la duración del audio: lo repite junto con la animación. Por eso, con **Una vez**, la extensión agrega 30 segundos al final: el último cuadro se queda quieto y el audio se rellena con silencio (pesa unos pocos KB). Así se ve y se oye una sola vez y luego queda detenido. Con **En bucle** la animación se repite sin pausa.

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
| `src/core/audio.js` | Decodifica el audio, recorta con fundido de 8 ms, normaliza el volumen (−16 dBFS, pico −1 dBFS), lo pasa a mono 48 kHz y lo codifica a Opus con `AudioEncoder`. |
| `src/core/ogg.js` | Empaqueta los paquetes Opus en Ogg (OpusHead, OpusTags, páginas con CRC). |
| `src/core/look.js` | Encuadre (zoom y posición), quitar un color de fondo y texto encima. |
| `src/core/frames.js` | Abre la fuente (video, GIF/WebP/APNG con `ImageDecoder`, imagen fija) y captura los cuadros del tramo. |
| `src/core/webp.js` | Arma el WebP animado (VP8X, ANIM, ANMF, EXIF) a partir de los cuadros que codifica el canvas. |
| `src/core/build.js` | Une todo y busca la mejor combinación de resolución, calidad y fps que quepa en 1 MB. Fusiona cuadros repetidos. |
| `src/wa/whatsapp.js` | Habla con WhatsApp Web: activa la función localmente, sube el audio y envía el sticker con el audio enlazado. |
| `src/ui/panel.js` | Panel flotante (Shadow DOM). |
| `src/ui/timeline.js` | Línea de tiempo con miniaturas, forma de onda y asas para elegir el tramo. |
| `src/history.js` | Historial opcional en `chrome.storage.local` (a través de `src/bridge.js`). |
| `src/youtube.js`, `src/yt-client.js`, `src/bridge.js` | Grabación de tramos de YouTube: el fondo abre la pestaña y graba con `captureStream` + `MediaRecorder`; el puente pasa el resultado a WhatsApp Web. |
| `dev/` | Páginas para probar la conversión y el panel sin WhatsApp (ábrelas con un servidor local o directamente en Chrome). |

## Si algo falla

- **No aparece el panel:** recarga WhatsApp Web (F5); las pestañas abiertas antes de instalar no tienen la extensión.
- **«No se pudo enviar…»:** WhatsApp pudo haber cambiado sus módulos internos. Abre la consola (F12) y busca mensajes `[Sonistick]`.
- **El sticker llega sin sonido:** tu cuenta o la de quien lo recibe puede no tener aún la función. Prueba con **Enviármelo a mí** y ábrelo en el celular.
