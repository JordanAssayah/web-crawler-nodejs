/**
 * HTML parsing utilities for extracting links
 * Overall Flow
Try JSDOM with virtual console to suppress CSS errors
If JSDOM fails → catch specific error types → use regex fallback
If everything fails → log error and return empty array
Never crash the crawler due to problematic HTML
 */

import { JSDOM, VirtualConsole } from "jsdom";
import { resolveUrl } from "./url.js";

/**
 * Extract all links from HTML content
 */
export function extractLinks(html: string, baseUrl: string): string[] {
  try {
    // Create a virtual console to handle JSDOM errors gracefully
    // You can check the following link for more information on virtual consoles and how to use them
    // https://github.com/jsdom/jsdom?tab=readme-ov-file#virtual-consoles
    const virtualConsole = new VirtualConsole();

    // Suppress CSS parsing errors and other non-critical errors
    virtualConsole.on("error", (error: Error) => {
      // Only log errors that aren't CSS-related
      if (!error.message.includes("Could not parse CSS")) {
        console.error("JSDOM Error:", error.message);
      }
    });

    const dom = new JSDOM(html, {
      virtualConsole,
      // Minimal configuration to avoid VM context and other JSDOM errors
      resources: "usable",
      runScripts: "outside-only",
      pretendToBeVisual: false,
    });
    const document = dom.window.document;
    const linkElements = document.querySelectorAll("a[href]");

    const links: string[] = [];

    linkElements.forEach((element) => {
      const href = element.getAttribute("href");
      if (href) {
        const absoluteUrl = resolveUrl(href, baseUrl);
        if (absoluteUrl) {
          links.push(absoluteUrl);
        }
      }
    });

    return links;
  } catch (error) {
    // Handle various JSDOM errors more gracefully
    if (error instanceof Error) {
      // CSS parsing errors
      if (error.message.includes("Could not parse CSS")) {
        console.warn(
          `CSS parsing error ignored for ${baseUrl}: continuing with link extraction`
        );
        return extractLinksWithRegex(html, baseUrl);
      }

      // JSDOM VM context errors
      if (
        error.message.includes(
          "context parameter must be a contextified object"
        ) ||
        error.message.includes("contextified") ||
        error.stack?.includes("Window.js")
      ) {
        console.warn(
          `JSDOM initialization error for ${baseUrl}: falling back to regex extraction`
        );
        return extractLinksWithRegex(html, baseUrl);
      }
    }

    console.error(`Error parsing HTML from ${baseUrl}:`, error);
    return [];
  }
}

/**
 * Fallback method to extract links using regex when JSDOM fails
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
