const MAX_TEXTURE = 2048;

export async function fileToCanvas(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_TEXTURE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Impossible de préparer l’image.");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas;
}
