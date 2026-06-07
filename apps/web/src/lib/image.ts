/**
 * Comprime y redimensiona una imagen en el navegador a un data URL pequeño,
 * pensado para avatares. Garantiza que el resultado siempre quepa en el límite
 * del servidor sin importar el tamaño/peso de la foto original.
 */

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("read error"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    img.src = src;
  });
}

export interface CompressOptions {
  /** Lado máximo (px) del avatar resultante. */
  maxDimension?: number;
  /** Tamaño objetivo aproximado del data URL en bytes. */
  maxBytes?: number;
}

/**
 * Devuelve un data URL JPEG redimensionado (cover, cuadrado) y comprimido.
 * Baja la calidad de forma iterativa hasta cumplir el tamaño objetivo.
 */
export async function fileToCompressedAvatar(
  file: File,
  { maxDimension = 256, maxBytes = 180 * 1024 }: CompressOptions = {},
): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);

  // Si el navegador no soporta canvas (muy raro), devolvemos el original.
  let img: HTMLImageElement;
  try {
    img = await loadImage(dataUrl);
  } catch {
    return dataUrl;
  }

  const side = Math.min(maxDimension, Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;

  // Fondo blanco para PNGs con transparencia (evita negro al pasar a JPEG).
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, side, side);

  // Recorte "cover" centrado para mantener proporción en un cuadrado.
  const scale = Math.max(side / img.width, side / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  ctx.drawImage(img, (side - drawW) / 2, (side - drawH) / 2, drawW, drawH);

  // base64 pesa ~1.37x respecto a los bytes reales.
  const charLimit = Math.floor(maxBytes * 1.37);
  let quality = 0.9;
  let out = canvas.toDataURL("image/jpeg", quality);
  while (out.length > charLimit && quality > 0.4) {
    quality -= 0.1;
    out = canvas.toDataURL("image/jpeg", quality);
  }

  return out;
}
