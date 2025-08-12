import type { CrawlResult, PageData, CrawlOptions } from "../types/index.js";
import { isSameDomain } from "../utils/url.js";
import { fetchPage } from "../utils/http.js";
import { extractLinks } from "../utils/html.js";
import { calculateRatio } from "../output/tsv.js";
import { crawlerLogger } from "../utils/logger.js";

export class WebCrawler {
  private rootUrl: string;
  private maxDepth: number;
  private batchSize: number;
  private timeout: number;
  private visited: Set<string> = new Set();
  private results: CrawlResult[] = [];

  constructor(options: CrawlOptions) {
    this.rootUrl = options.rootUrl;
    this.maxDepth = options.maxDepth;
    this.batchSize = options.batchSize || 10;
    this.timeout = options.timeout || 10000;
  }

  private async extractLinksFromPage(
    url: string,
    depth: number
  ): Promise<PageData | null> {
    const html = await fetchPage(url, { timeout: this.timeout });
    if (!html) return null;

    const links = extractLinks(html, url);
    return { url, depth, links };
  }

  /**
   * Check if a URL is same domain as root URL
   */
  private isSameDomainAsRoot(url: string): boolean {
    return isSameDomain(url, this.rootUrl, this.rootUrl);
  }

  /**
   * Main crawling logic with parallel processing
   */
  async crawl(): Promise<CrawlResult[]> {
    crawlerLogger.info(
      {
        rootUrl: this.rootUrl,
        maxDepth: this.maxDepth,
        batchSize: this.batchSize,
        timeout: this.timeout,
      },
      "Starting single-threaded web crawl"
    );

    const queue: Array<{ url: string; depth: number }> = [
      { url: this.rootUrl, depth: 0 },
    ];

    while (queue.length > 0) {
      // Process pages in parallel for better performance
      const batch = queue.splice(0, this.batchSize);
      const promises = batch.map(async ({ url, depth }) => {
        if (this.visited.has(url) || depth > this.maxDepth) {
          return null;
        }

        this.visited.add(url);
        return await this.extractLinksFromPage(url, depth);
      });

      const results = await Promise.all(promises);

      crawlerLogger.info(
        {
          batchSize: results.length,
          queueLength: queue.length,
          totalProcessed: this.results.length,
        },
        "Processing batch"
      );
      for (const pageData of results) {
        if (!pageData) continue;

        const { url, depth, links } = pageData;
        const ratio = calculateRatio(links, url, (link, pageUrl) =>
          isSameDomain(link, pageUrl, this.rootUrl)
        );

        this.results.push({ url, depth, ratio });
        crawlerLogger.debug(
          {
            url,
            depth,
            ratio: Number(ratio.toFixed(3)),
            linksFound: links.length,
          },
          "Page processed"
        );

        // Add new URLs to queue if we haven't reached max depth
        if (depth < this.maxDepth) {
          for (const link of links) {
            if (!this.visited.has(link) && this.isSameDomainAsRoot(link)) {
              queue.push({ url: link, depth: depth + 1 });
            }
          }
        }
      }
    }

    crawlerLogger.info(
      {
        totalPages: this.results.length,
        rootUrl: this.rootUrl,
        maxDepth: this.maxDepth,
      },
      "Single-threaded crawl completed"
    );
    return this.results;
  }

  /**
   * Get crawl results
   */
  getResults(): CrawlResult[] {
    return this.results;
  }
}
