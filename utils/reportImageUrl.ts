const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'https://dev.greenlegacy.ng').replace(/\/$/, '');

/**
 * Resolves a report image path from the API to a full URL.
 * API returns relative paths like "/media/uploads/Tamarin.JPG" which need the base URL.
 */
export function getReportImageUrl(path: string | undefined): string | undefined {
  if (!path || path.trim() === '') return undefined;
  const trimmed = path.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const base = API_BASE_URL;
  const segment = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}${segment}`;
}

/**
 * Resolves an array of report image paths to full URLs (filters out empty).
 */
export function getReportImageUrls(paths: string[] | undefined): string[] {
  if (!paths || !Array.isArray(paths)) return [];
  return paths.map((p) => getReportImageUrl(p)).filter((url): url is string => !!url);
}
