import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import type { CrawlResult } from "../types/index.js";

/**
 * Generate a filename that includes the base URL and timestamp
 */
export function generateFilename(baseUrl: string): string {
  try {
    const url = new URL(baseUrl);
    const hostname = url.hostname;

    // Sanitize hostname for filename use
    const sanitizedHostname = hostname.replace(/[^a-zA-Z0-9.-]/g, "_");

    // Generate timestamp in YYYY-MM-DD_HH-mm-ss format
    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/:/g, "-")
      .replace(/\./g, "-")
      .slice(0, 19); // Remove milliseconds and Z

    return `${sanitizedHostname}_${timestamp}.tsv`;
  } catch (error) {
    // Fallback to default filename with timestamp if URL parsing fails
    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, "-")
      .replace(/\./g, "-")
      .slice(0, 19);
    return `crawl_results_${timestamp}.tsv`;
  }
}

export function generateTSV(results: CrawlResult[]): string {
  const header = "Url\tdepth\tratio\n";
  const rows = results
    .sort((a, b) => a.depth - b.depth || a.url.localeCompare(b.url))
    .map(
      (result) => `${result.url}\t${result.depth}\t${result.ratio.toFixed(6)}`
    )
    .join("\n");

  return header + rows;
}

export function saveToTSV(
  results: CrawlResult[],
  filename: string = "crawl_results.tsv"
): void {
  // Ensure outputs directory exists
  const outputsDir = "outputs";
  mkdirSync(outputsDir, { recursive: true });

  // Create full path to the file in outputs directory
  const fullPath = join(outputsDir, filename);

  const tsvContent = generateTSV(results);
  writeFileSync(fullPath, tsvContent, "utf-8");
  console.log(`Results saved to ${fullPath}`);
}

/**
 * Calculate same-domain links ratio
 */
export function calculateRatio(
  links: string[],
  pageUrl: string,
  isSameDomainFn: (url1: string, url2: string) => boolean
): number {
  if (links.length === 0) return 0;

  const sameDomainCount = links.filter((link) =>
    isSameDomainFn(link, pageUrl)
  ).length;
  return sameDomainCount / links.length;
}
