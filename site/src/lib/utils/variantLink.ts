import { variants } from '$lib/data/variants';

const defaultVariant = 'default';
const basePath = 'https://briananderson.xyz';

export function addVariant(path: string, variant: string | null | undefined): string {
  if (!variant || variant === defaultVariant) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}v=${variant}`;
}

export function removeVariant(path: string): string {
  const url = new URL(path, 'http://temp.com');
  url.searchParams.delete('v');
  return url.pathname + url.search;
}

export function getVariant(url: URL): string | null {
  const queryVariant = url.searchParams.get('v');
  if (queryVariant) return queryVariant;

  const pathParts = url.pathname.split('/').filter(Boolean);
  if (pathParts.length > 0 && variants.find(v => v.key === pathParts[0])) {
    return pathParts[0];
  }

  return null;
}

export function getCanonicalVariantPath(path: string, variant: string | null | undefined): string {
  if (!variant || variant === defaultVariant) {
    return removeVariantFromPath(path);
  }

  return addVariantToPath(path, variant);
}

function removeVariantFromPath(path: string): string {
  const nonDefaultVariants = variants.filter(v => v.key !== defaultVariant);
  
  if (path === '/' || path === '/index.html') return '/';

  for (const variant of nonDefaultVariants) {
    if (path === `/${variant.key}/` || path === `/${variant.key}/resume/`) {
      return path.replace(`/${variant.key}`, '');
    }
  }

  return removeVariant(path);
}

function addVariantToPath(path: string, variant: string): string {
  if (path === '/' || path === '/index.html') {
    return `/${variant}/`;
  }

  const parts = path.split('/').filter(Boolean);
  if (parts.length > 0 && !variants.find(v => v.key === parts[0])) {
    return `/${variant}${path}`;
  }

  return addVariant(path, variant);
}

export function getRedirectTarget(path: string, variant: string | null | undefined): string | null {
  if (!variant || variant === defaultVariant) {
    return null;
  }

  const canonicalPath = addVariantToPath(path, variant);
  return canonicalPath !== path ? canonicalPath : null;
}

export function getCanonicalUrl(path: string): string {
  return `${basePath}${path}`;
}
