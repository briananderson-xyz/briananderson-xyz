import { variants } from '$lib/data/variants';

const defaultVariant = 'default';
const basePath = 'https://briananderson.xyz';

export function addVariant(path: string, variant: string | null | undefined): string {
  if (!variant || variant === defaultVariant) return path;

  // Handle canonical paths
  if (path === '/' || path === '/index.html') {
    return `/${variant}/`;
  }
  if (path === '/resume' || path === '/resume/') {
    return `/${variant}/resume/`;
  }

  // Handle hash-only paths on the homepage (e.g., /#contact -> /ops/#contact)
  if (path.startsWith('/#')) {
    return `/${variant}/${path.slice(1)}`;
  }

  // Ensure we don't add duplicate query params
  if (path.includes(`v=${variant}`)) return path;

  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}v=${variant}`;
}

export function removeVariant(path: string): string {
  try {
    // If path is relative, we need a base to use URL API
    const url = new URL(path, 'http://temp.com');
    url.searchParams.delete('v');
    // Return path + search (without v) + hash
    return url.pathname + url.search + url.hash;
  } catch {
    return path;
  }
}

export function getVariant(url: URL): string | null {
  // During prerendering, searchParams access is not allowed
  // We can safely skip the query param check and rely on path-based detection
  try {
    const queryVariant = url.searchParams.get('v');
    if (queryVariant) return queryVariant;
  } catch {
    // Ignore error during prerendering
  }

  const pathParts = url.pathname.split('/').filter(Boolean);
  if (pathParts.length > 0 && variants.find(v => v.key === pathParts[0])) {
    return pathParts[0];
  }

  return null;
}

export function getCanonicalVariantPath(path: string, variant: string | null | undefined): string {
  const cleanPath = removeVariantFromPath(path);
  return addVariant(cleanPath, variant);
}

function removeVariantFromPath(path: string): string {
  let clean = path;

  // First remove query param variant
  clean = removeVariant(clean);

  // Then remove path prefix variants
  // We check specifically for our known variants to avoid false positives
  for (const v of variants) {
    if (v.key === defaultVariant) continue;

    // Check for /variant/ (e.g. /ops/resume/)
    // or /variant (e.g. /ops)
    const prefixSlash = `/${v.key}/`;
    const exactMatch = `/${v.key}`;

    if (clean.startsWith(prefixSlash)) {
      // /ops/resume/ -> /resume/
      clean = '/' + clean.slice(prefixSlash.length);
    } else if (clean === exactMatch) {
      // /ops -> /
      clean = '/';
    }
  }

  return clean;
}

export function getRedirectTarget(path: string, variant: string | null | undefined): string | null {
  if (!variant || variant === defaultVariant) {
    return null;
  }

  // Only redirect for specifically planned canonical routes
  // Logic: If on generic route (e.g. /) with variant (ops) -> redirect to /ops/
  if (path === '/' || path === '/index.html') {
    return `/${variant}/`;
  }
  if (path === '/resume' || path === '/resume/') {
    return `/${variant}/resume/`;
  }

  return null;
}

export function getCanonicalUrl(path: string): string {
  return `${basePath}${path}`;
}
