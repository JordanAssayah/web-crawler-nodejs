/**
 * HTTP utilities for fetching web pages
 */

export interface FetchOptions {
  timeout?: number;
  userAgent?: string;
}

/**
 * Common file extensions that are unlikely to contain HTML content
 */
const FILE_EXTENSIONS = [
  ".txt",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".zip",
  ".rar",
  ".tar",
  ".gz",
  ".7z",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".svg",
  ".webp",
  ".mp3",
  ".mp4",
  ".avi",
  ".mov",
  ".wmv",
  ".flv",
  ".mkv",
  ".css",
  ".js",
  ".json",
  ".xml",
  ".csv",
  ".exe",
  ".dmg",
  ".deb",
  ".rpm",
  ".msi",
  ".iso",
  ".img",
];

/**
 * Check if a URL appears to be a file URL rather than an HTML page
 */
function isLikelyFileUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();

    // Check if the pathname ends with a known file extension
    return FILE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
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
