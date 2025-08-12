#!/usr/bin/env bun

/**
 * Web Crawler - Main Entry Point
 *
 * A high-performance web crawler that calculates same-domain link ratios
 * and outputs results in TSV format.
 */

import { parseArgs } from "./src/cli.js";
import { WebCrawler } from "./src/crawler/crawler.js";
import { ParallelWebCrawler } from "./src/crawler/parallel-crawler.js";
import { saveToTSV, generateTSV, generateFilename } from "./src/output/tsv.js";
import { getCpuCoreCount } from "./src/utils/system.js";

async function main() {
  try {
    // Parse and validate command line arguments
    const { rootUrl, maxDepth, maxWorkers } = parseArgs();

    console.log(`=== Web Crawler Configuration ===`);
    console.log(`Root URL: ${rootUrl}`);
    console.log(`Max Depth: ${maxDepth}`);
    console.log(`CPU Cores Available: ${getCpuCoreCount()}`);
    if (maxWorkers !== undefined) {
      console.log(`Max Workers Specified: ${maxWorkers}`);
    }

    // Choose between parallel and single-threaded crawler
    // Use parallel crawler if more than 1 core is available and maxWorkers is not 1
    const useParallel =
      getCpuCoreCount() > 1 && (maxWorkers === undefined || maxWorkers > 1);

    let results;

    // Start timing the crawling process
    const startTime = performance.now();

    if (useParallel) {
      console.log(`Using Parallel Web Crawler for maximum performance`);

      // Create and configure the parallel crawler
      const crawler = new ParallelWebCrawler({
        rootUrl,
        maxDepth,
        timeout: 10000,
        maxWorkers,
      });

      // Run the parallel crawl
      results = await crawler.crawl();
    } else {
      if (maxWorkers === 1) {
        console.log(
          `Using Single-threaded Web Crawler (maxWorkers=1 specified)`
        );
      } else {
        console.log(
          `Using Single-threaded Web Crawler (single CPU core system)`
        );
      }

      // Create and configure the single-threaded crawler
      const crawler = new WebCrawler({
        rootUrl,
        maxDepth,
        batchSize: 10,
        timeout: 10000,
      });

      // Run the crawl
      results = await crawler.crawl();
    }

    // Calculate the total crawling time
    const endTime = performance.now();
    const totalTimeMs = Math.round(endTime - startTime);
    const totalTimeSec = (totalTimeMs / 1000).toFixed(2);

    // Generate filename with base URL and timestamp
    const filename = generateFilename(rootUrl);

    // Save results to file
    saveToTSV(results, filename);

    // Also print results to console
    console.log("\n=== RESULTS ===");
    console.log(generateTSV(results));
    console.log(`\nResults saved to: ${filename}`);
    console.log(`Total pages crawled: ${results.length}`);
    console.log(`\n=== PERFORMANCE ===`);
    console.log(`Total crawling time: ${totalTimeSec}s (${totalTimeMs}ms)`);
    console.log(
      `Average time per page: ${(totalTimeMs / results.length).toFixed(2)}ms`
    );
    if (useParallel) {
      const workerCount =
        maxWorkers || `auto-detected (${Math.max(1, getCpuCoreCount() - 1)})`;
      console.log(`Performance mode: Parallel (${workerCount} workers)`);
    } else {
      console.log(`Performance mode: Single-threaded`);
    }
  } catch (error) {
    console.error("Error during crawling:", error);
    process.exit(1);
  }
}

// Run the main function
if (import.meta.main) {
  main().catch(console.error);
}
