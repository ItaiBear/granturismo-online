// Loads and caches images (with runtime colorkey -> alpha), and the music track.
// Mirrors granturismo/assets.py: surfaces are pre-processed once and reused.

const imageCache = new Map();

function cacheKey(src, colorkey) {
  return colorkey ? `${src}#${colorkey.join(",")}` : src;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// Convert a solid colorkey background to transparency, returning a canvas that
// can be passed straight to ctx.drawImage.
function applyColorkey(img, colorkey) {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth || img.width;
  c.height = img.naturalHeight || img.height;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);
  if (colorkey) {
    const [kr, kg, kb] = colorkey;
    const data = ctx.getImageData(0, 0, c.width, c.height);
    const px = data.data;
    // A little tolerance handles anti-aliased edges / JPEG-ish artifacts.
    const tol = 12;
    for (let i = 0; i < px.length; i += 4) {
      if (
        Math.abs(px[i] - kr) <= tol &&
        Math.abs(px[i + 1] - kg) <= tol &&
        Math.abs(px[i + 2] - kb) <= tol
      ) {
        px[i + 3] = 0;
      }
    }
    ctx.putImageData(data, 0, 0);
  }
  return c;
}

export async function surface(src, colorkey = null) {
  const key = cacheKey(src, colorkey);
  if (imageCache.has(key)) return imageCache.get(key);
  const img = await loadImage(src);
  const canvas = applyColorkey(img, colorkey);
  imageCache.set(key, canvas);
  return canvas;
}

// Preload a batch of { src, colorkey } specs.
export async function preload(specs) {
  await Promise.all(specs.map((s) => surface(s.src, s.colorkey || null)));
}

// Synchronous accessor for an already-preloaded surface (use inside render).
export function image(src, colorkey = null) {
  const c = imageCache.get(cacheKey(src, colorkey));
  if (!c) throw new Error(`Surface not preloaded: ${src}`);
  return c;
}

// Wait for the bundled webfonts so first-frame text uses the right typeface.
export async function loadFonts() {
  if (!document.fonts || !document.fonts.ready) return;
  try {
    await Promise.all([
      document.fonts.load("40px Carlito"),
      document.fonts.load("bold 40px Carlito"),
      document.fonts.load("bold 47px 'Comic Neue'"),
    ]);
    await document.fonts.ready;
  } catch (_) {
    /* fall back to whatever the browser has */
  }
}

// ---- Audio ----

export class Music {
  constructor(src, volume) {
    this.audio = new Audio(src);
    this.audio.loop = true;
    this.audio.volume = volume;
    this._desiredVolume = volume;
    this._started = false;
  }

  // Browsers block autoplay until a user gesture; call this from a click/keydown.
  start() {
    if (this._started) return;
    this._started = true;
    this.audio.play().catch(() => {
      // Autoplay still blocked; will retry on the next gesture.
      this._started = false;
    });
  }

  setVolume(v) {
    this._desiredVolume = v;
    this.audio.volume = v;
  }

  mute() {
    this.audio.volume = 0;
  }

  unmute() {
    this.audio.volume = this._desiredVolume;
  }

  pause() {
    this.audio.pause();
  }

  resume() {
    if (this._started) this.audio.play().catch(() => {});
  }
}
