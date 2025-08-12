/**
 * URL utility functions for domain checking and validation
 */

/**
 * Check if two URLs are from the same domain (including subdomain)
 * Same domain means exact match of protocol + hostname (including subdomain)
 */
export function isSameDomain(
  url1: string,
  url2: string,
  baseUrl: string
): boolean {
  try {
    const domain1 = new URL(url1, baseUrl);
    const domain2 = new URL(url2, baseUrl);

    // Same domain means exact match of protocol + hostname (including subdomain)
    return (
      `${domain1.protocol}//${domain1.hostname}` ===
      `${domain2.protocol}//${domain2.hostname}`
    );
  } catch {
    return false;
  }
}

/**
 * Validate if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert relative URLs to absolute URLs
 */
export function resolveUrl(href: string, baseUrl: string): string | null {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
}
