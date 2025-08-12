#!/usr/bin/env bun

/**
 * Web Crawler - Main Entry Point
 *
 * A high-performance web crawler that calculates same-domain link ratios
 * and outputs results in TSV format.
 */

import { parseArgs } from "./src/cli.js";
import { WebCrawler } from "./src/crawler/crawler.js";
import { saveToTSV, generateTSV, generateFilename } from "./src/output/tsv.js";

async function main() {
  try {
    // Parse and validate command line arguments
    const { rootUrl, maxDepth } = parseArgs();

    // Create and configure the crawler
    const crawler = new WebCrawler({
      rootUrl,
      maxDepth,
      batchSize: 10,
      timeout: 10000,
    });

    // Run the crawl
    const results = await crawler.crawl();

    // Generate filename with base URL and timestamp
    const filename = generateFilename(rootUrl);

    // Save results to file
    saveToTSV(results, filename);

    // Also print results to console
    console.log("\n=== RESULTS ===");
    console.log(generateTSV(results));
  } catch (error) {
    console.error("Error during crawling:", error);
    process.exit(1);
  }
}

// Run the main function
if (import.meta.main) {
  main().catch(console.error);
}
