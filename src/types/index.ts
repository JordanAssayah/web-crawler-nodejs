export interface CrawlResult {
  url: string;
  depth: number;
  ratio: number;
}

export interface PageData {
  url: string;
  depth: number;
  links: string[];
}

export interface CrawlOptions {
  rootUrl: string;
  maxDepth: number;
  batchSize?: number;
  timeout?: number;
  maxWorkers?: number;
}

export interface WorkerTask {
  id: string;
  urls: Array<{ url: string; depth: number }>;
  rootUrl: string;
  maxDepth: number;
  timeout: number;
}

export interface WorkerResult {
  taskId: string;
  results: CrawlResult[];
  newUrls: Array<{ url: string; depth: number }>;
  error?: string;
}
