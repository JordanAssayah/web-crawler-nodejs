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
}
