/**
 * HTTP utilities for fetching web pages
 */

export interface FetchOptions {
  timeout?: number;
  userAgent?: string;
}

/**
 * File extensions that we want to crawl (HTML-related content)
 */
const CRAWLABLE_EXTENSIONS = [
  "html",
  "htm",
  "xhtml",
  "shtml",
  "php",
  "asp",
  "aspx",
  "jsp",
  "cgi",
];

/**
 * Check if a URL appears to be a file URL rather than an HTML page
 * Uses regex to detect any file extension, then checks if it's crawlable
 */
function isLikelyFileUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();

    // Check if there's a file extension (dot followed by alphanumeric chars at end)
    const extensionMatch = pathname.match(/\.([a-z0-9]+)$/);

    if (!extensionMatch) {
      // No extension found, likely a regular page - crawl it
      return false;
    }

    const extension = extensionMatch[1];

    // If it has an extension but it's not in our crawlable list, skip it
    return !CRAWLABLE_EXTENSIONS.includes(extension);
  } catch {
    // If URL parsing fails, assume it's not a file URL
    return false;
  }
}

/**
 * Fetch a web page and return its HTML content
 */
export async function fetchPage(
  url: string,
  options: FetchOptions = {}
): Promise<string | null> {
  const { timeout = 10000, userAgent = "Web-Crawler-Bot/1.0" } = options;

  // Check if URL appears to be a file URL before making the request
  if (isLikelyFileUrl(url)) {
    console.error(`Skipping likely file URL (not HTML): ${url}`);
    return null;
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": userAgent,
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(timeout),
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch ${url}: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("text/html")) {
      console.error(`Skipping non-HTML content at ${url}`);
      return null;
    }

    return await response.text();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}
