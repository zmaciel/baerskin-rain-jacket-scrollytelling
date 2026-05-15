const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";

export function publicAssetPath(path: string) {
  if (!basePath || path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return path.startsWith("/") ? `${basePath}${path}` : `${basePath}/${path}`;
}
