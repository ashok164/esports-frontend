const IMAGE_PRELOAD_TIMEOUT_MS = 2500;
const BATCH_SIZE = 8;

const loadedImages = new Set<string>();
const loadingImages = new Map<string, Promise<void>>();

const normalizeUrls = (urls: string[]) =>
  Array.from(
    new Set(
      urls
        .map((url) => String(url || "").trim())
        .filter(Boolean),
    ),
  );

export const preloadImage = (src: string) => {
  const normalizedSrc = String(src || "").trim();

  if (!normalizedSrc) return Promise.resolve();
  if (loadedImages.has(normalizedSrc)) return Promise.resolve();

  const existingTask = loadingImages.get(normalizedSrc);
  if (existingTask) return existingTask;

  const task = new Promise<void>((resolve) => {
    const image = new Image();
    const finish = () => {
      window.clearTimeout(timer);
      loadedImages.add(normalizedSrc);
      loadingImages.delete(normalizedSrc);
      resolve();
    };
    const timer = window.setTimeout(finish, IMAGE_PRELOAD_TIMEOUT_MS);

    image.onload = finish;
    image.onerror = finish;
    image.decoding = "async";
    image.src = normalizedSrc;
  });

  loadingImages.set(normalizedSrc, task);
  return task;
};

export const warmImageUrls = async (urls: string[]) => {
  const normalizedUrls = normalizeUrls(urls);

  for (let index = 0; index < normalizedUrls.length; index += BATCH_SIZE) {
    const batch = normalizedUrls.slice(index, index + BATCH_SIZE);
    await Promise.all(batch.map(preloadImage));
  }
};

export const isImageWarm = (src: string) =>
  loadedImages.has(String(src || "").trim());
