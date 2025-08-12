/**
 * HTML parsing utilities for extracting links using Cheerio
 * Cheerio is much faster and lighter than JSDOM for static HTML parsing
 */

import * as cheerio from "cheerio";
import { resolveUrl } from "./url.js";
import { htmlLogger } from "./logger.js";

/**
 * Extract all links from HTML content using Cheerio
 * Much faster and more efficient than JSDOM for link extraction
 */
export function extractLinks(html: string, baseUrl: string): string[] {
  try {
    // Load HTML with Cheerio - much faster than JSDOM
    const $ = cheerio.load(html, {
      // Configure for performance and error tolerance
      xml: false, // Parse as HTML, not XML
    });

    const links: string[] = [];

    // Extract all href attributes from anchor tags
    $("a[href]").each((_, element) => {
      const href = $(element).attr("href");
      if (href) {
        const absoluteUrl = resolveUrl(href, baseUrl);
        if (absoluteUrl) {
          links.push(absoluteUrl);
        }
      }
    });

    return links;
  } catch (error) {
    htmlLogger.error(
      { baseUrl, error: (error as Error).message },
      "Error parsing HTML"
    );
    // Fallback to regex if Cheerio fails (very unlikely)
    return extractLinksWithRegex(html, baseUrl);
  }
}

/**
 * Fallback method to extract links using regex when parsing fails
 */
function extractLinksWithRegex(html: string, baseUrl: string): string[] {
  const links: string[] = [];

  // Simple regex to find href attributes in anchor tags
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    if (href) {
      const absoluteUrl = resolveUrl(href, baseUrl);
      if (absoluteUrl) {
        links.push(absoluteUrl);
      }
    }
  }

  return links;
}
