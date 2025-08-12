import { Worker } from "worker_threads";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type {
  CrawlResult,
  CrawlOptions,
  WorkerTask,
  WorkerResult,
} from "../types/index.js";
import { getOptimalWorkerCount } from "../utils/system.js";
import { isSameDomain } from "../utils/url.js";
import { parallelCrawlerLogger } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class ParallelWebCrawler {
  private rootUrl: string;
  private maxDepth: number;
  private timeout: number;
  private maxWorkers: number;
  private visited: Set<string> = new Set();
  private results: CrawlResult[] = [];

  constructor(options: CrawlOptions) {
    this.rootUrl = options.rootUrl;
    this.maxDepth = options.maxDepth;
    this.timeout = options.timeout || 10000;
    this.maxWorkers = getOptimalWorkerCount(options.maxWorkers);
  }

  /**
   * Check if a URL is same domain as root URL
   */
  private isSameDomainAsRoot(url: string): boolean {
    return isSameDomain(url, this.rootUrl, this.rootUrl);
  }

  /**
   * Distribute URLs among workers
   */
  private distributeUrls(
    urls: Array<{ url: string; depth: number }>
  ): WorkerTask[] {
    const tasks: WorkerTask[] = [];
    const urlsPerWorker = Math.ceil(urls.length / this.maxWorkers);

    for (
      let i = 0;
      i < this.maxWorkers && i * urlsPerWorker < urls.length;
      i++
    ) {
      const startIndex = i * urlsPerWorker;
      const endIndex = Math.min(startIndex + urlsPerWorker, urls.length);
      const workerUrls = urls.slice(startIndex, endIndex);

      if (workerUrls.length > 0) {
        tasks.push({
          id: `worker-${i}`,
          urls: workerUrls,
          rootUrl: this.rootUrl,
          maxDepth: this.maxDepth,
          timeout: this.timeout,
        });
      }
    }

    return tasks;
  }

  /**
   * Execute tasks using worker threads
   */
  private async executeWorkerTasks(
    tasks: WorkerTask[]
  ): Promise<WorkerResult[]> {
    const workerPromises = tasks.map(
      (task) =>
        new Promise<WorkerResult>((resolve, reject) => {
          const worker = new Worker(join(__dirname, "worker.js"), {
            workerData: task,
          });

          worker.on("message", (result: WorkerResult) => {
            worker.terminate();
            resolve(result);
          });

          worker.on("error", (error) => {
            worker.terminate();
            reject(error);
          });

          worker.on("exit", (code) => {
            if (code !== 0) {
              reject(new Error(`Worker stopped with exit code ${code}`));
            }
          });
        })
    );

    return Promise.all(workerPromises);
  }

  /**
   * Process worker results and collect new URLs
   */
  private processWorkerResults(
    workerResults: WorkerResult[]
  ): Array<{ url: string; depth: number }> {
    const newUrls: Array<{ url: string; depth: number }> = [];

    for (const workerResult of workerResults) {
      if (workerResult.error) {
        parallelCrawlerLogger.error(
          {
            workerId: workerResult.taskId,
            error: workerResult.error,
            resultsCount: workerResult.results.length,
          },
          "Worker completed with error"
        );
        continue;
      }

      // Collect results
      this.results.push(...workerResult.results);

      // Process new URLs from this worker
      for (const urlData of workerResult.newUrls) {
        if (
          !this.visited.has(urlData.url) &&
          this.isSameDomainAsRoot(urlData.url)
        ) {
          this.visited.add(urlData.url);
          newUrls.push(urlData);
        }
      }

      parallelCrawlerLogger.info(
        {
          workerId: workerResult.taskId,
          pagesProcessed: workerResult.results.length,
          newUrlsFound: workerResult.newUrls.length,
        },
        "Worker completed successfully"
      );
    }

    return newUrls;
  }

  /**
   * Main crawling logic with parallel worker processing
   */
  async crawl(): Promise<CrawlResult[]> {
    parallelCrawlerLogger.info(
      {
        rootUrl: this.rootUrl,
        maxDepth: this.maxDepth,
        maxWorkers: this.maxWorkers,
        timeout: this.timeout,
      },
      "Starting parallel web crawl"
    );

    let currentUrls: Array<{ url: string; depth: number }> = [
      { url: this.rootUrl, depth: 0 },
    ];

    this.visited.add(this.rootUrl);

    while (currentUrls.length > 0) {
      // Distribute URLs among workers
      const tasks = this.distributeUrls(currentUrls);

      parallelCrawlerLogger.info(
        {
          urlCount: currentUrls.length,
          workerCount: tasks.length,
          iteration: this.results.length > 0 ? "continuing" : "initial",
        },
        "Processing URLs in parallel"
      );

      if (tasks.length === 0) break;

      try {
        // Execute tasks in parallel using worker threads
        const workerResults = await this.executeWorkerTasks(tasks);

        // Process results and get new URLs for next iteration
        currentUrls = this.processWorkerResults(workerResults);

        parallelCrawlerLogger.info(
          {
            newUrlsFound: currentUrls.length,
            totalProcessed: this.results.length,
          },
          "Iteration completed"
        );
      } catch (error) {
        parallelCrawlerLogger.error(
          {
            error: error instanceof Error ? error.message : String(error),
            currentUrlsCount: currentUrls.length,
            totalProcessed: this.results.length,
          },
          "Error during parallel processing"
        );
        break;
      }
    }

    parallelCrawlerLogger.info(
      {
        totalPages: this.results.length,
        rootUrl: this.rootUrl,
        maxDepth: this.maxDepth,
        workersUsed: this.maxWorkers,
      },
      "Parallel crawl completed"
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
