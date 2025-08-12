import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import type { WorkerTask, WorkerResult, CrawlResult } from "../types/index.js";
import { isSameDomain } from "../utils/url.js";
import { fetchPage } from "../utils/http.js";
import { extractLinks } from "../utils/html.js";
import { calculateRatio } from "../output/tsv.js";

/**
 * Worker thread implementation for parallel web crawling
 */
class CrawlerWorker {
  private visited: Set<string> = new Set();
  private results: CrawlResult[] = [];
  private newUrls: Array<{ url: string; depth: number }> = [];

  constructor(private task: WorkerTask) {}

  /**
   * Check if a URL is same domain as root URL
   */
  private isSameDomainAsRoot(url: string): boolean {
    return isSameDomain(url, this.task.rootUrl, this.task.rootUrl);
  }

  /**
   * Extract links from a page and calculate same-domain ratio
   */
  private async processPage(url: string, depth: number): Promise<boolean> {
    try {
      if (this.visited.has(url) || depth > this.task.maxDepth) {
        return false;
      }

      this.visited.add(url);

      const html = await fetchPage(url, { timeout: this.task.timeout });
      if (!html) return false;

      const links = extractLinks(html, url);
      const ratio = calculateRatio(links, url, (link, pageUrl) =>
        isSameDomain(link, pageUrl, this.task.rootUrl)
      );

      this.results.push({ url, depth, ratio });

      // Collect new URLs for next depth level
      if (depth < this.task.maxDepth) {
        for (const link of links) {
          if (!this.visited.has(link) && this.isSameDomainAsRoot(link)) {
            this.newUrls.push({ url: link, depth: depth + 1 });
          }
        }
      }

      return true;
    } catch (error) {
      console.error(`Error processing ${url}:`, error);
      return false;
    }
  }

  /**
   * Process all URLs assigned to this worker
   */
  async processUrls(): Promise<WorkerResult> {
    try {
      console.log(`Worker processing ${this.task.urls.length} URLs`);

      // Process all URLs in parallel
      const promises = this.task.urls.map(({ url, depth }) =>
        this.processPage(url, depth)
      );

      await Promise.all(promises);

      return {
        taskId: this.task.id,
        results: this.results,
        newUrls: this.newUrls,
      };
    } catch (error) {
      return {
        taskId: this.task.id,
        results: this.results,
        newUrls: this.newUrls,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

// Worker thread entry point
if (!isMainThread && parentPort) {
  const task: WorkerTask = workerData;
  const worker = new CrawlerWorker(task);

  worker
    .processUrls()
    .then((result) => {
      parentPort!.postMessage(result);
    })
    .catch((error) => {
      parentPort!.postMessage({
        taskId: task.id,
        results: [],
        newUrls: [],
        error: error.message,
      } as WorkerResult);
    });
}

export { CrawlerWorker };
