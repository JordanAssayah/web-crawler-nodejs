/**
 * HTTP utilities for fetching web pages
 */

import { httpLogger } from "./logger.js";
import { isValidUrl } from "./url.js";

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

    // If extension consists only of numbers, assume it's a valid HTML page
    if (/^\d+$/.test(extension)) {
      return false; // Numbers-only extension = HTML page
    }

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
    // Log file URL skips at debug level - normal behavior, not an error
    httpLogger.debug(
      { url, reason: "file_extension" },
      "Skipping likely file URL (not HTML)"
    );
    return null;
  }

  try {
    // Validate URL before making request to avoid fetch errors
    if (!isValidUrl(url)) {
      // Invalid URL - log at debug level for visibility
      httpLogger.debug(
        { url, error: "Invalid URL format" },
        "Invalid URL format"
      );
      return null;
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": userAgent,
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(timeout),
    });

    if (!response.ok) {
      // HTTP errors are always important to track
      httpLogger.warn(
        {
          url,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        },
        "HTTP request failed"
      );
      return null;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("text/html")) {
      // Log content-type mismatches at info level - useful for monitoring
      httpLogger.info(
        {
          url,
          contentType: contentType || "missing",
          reason: "non_html_content",
        },
        "Skipping non-HTML content"
      );
      return null;
    }

    return await response.text();
  } catch (error) {
    // Use appropriate log levels based on error type and environment
    if (
      error instanceof DOMException &&
      (error.name === "AbortError" || error.name === "TimeoutError")
    ) {
      // Log timeouts at info level - useful for monitoring but not critical
      httpLogger.info(
        {
          url,
          errorName: error.name,
          timeout,
          reason: "request_timeout",
        },
        "Request timeout"
      );
    } else {
      // Log unexpected errors at error level - always important to track
      httpLogger.error(
        {
          url,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        "Unexpected error fetching page"
      );
    }
    return null;
  }
}
