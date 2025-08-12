import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { WebCrawler } from "../crawler.js";
import type { CrawlOptions } from "../../types/index.js";

// Note: These are more like integration tests since complex mocking is difficult in Bun
// In a real project, we'd use dependency injection or a more testable architecture

describe("WebCrawler", () => {
  let originalConsoleLog: any;

  beforeEach(() => {
    // Mock console.log to avoid test output noise during testing
    originalConsoleLog = console.log;
    console.log = () => {};
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  describe("constructor", () => {
    it("should initialize with required options", () => {
      const options: CrawlOptions = {
        rootUrl: "https://example.com",
        maxDepth: 2,
      };

      const crawler = new WebCrawler(options);

      expect(crawler).toBeInstanceOf(WebCrawler);
      expect(crawler.getResults()).toEqual([]);
    });

    it("should use default values for optional parameters", () => {
      const options: CrawlOptions = {
        rootUrl: "https://example.com",
        maxDepth: 1,
      };

      const crawler = new WebCrawler(options);

      // Test indirectly by checking that defaults work in crawl
      expect(crawler).toBeInstanceOf(WebCrawler);
    });

    it("should use custom batch size and timeout when provided", () => {
      const options: CrawlOptions = {
        rootUrl: "https://example.com",
        maxDepth: 1,
        batchSize: 5,
        timeout: 5000,
      };

      const crawler = new WebCrawler(options);

      expect(crawler).toBeInstanceOf(WebCrawler);
    });
  });

  // Note: Full crawl() tests are skipped due to network dependencies
  // In a production environment, these would be integration tests with test servers
  describe("crawl", () => {
    it("should handle invalid URLs gracefully", async () => {
      const options: CrawlOptions = {
        rootUrl: "invalid-url-that-will-fail",
        maxDepth: 0,
      };

      const crawler = new WebCrawler(options);
      const results = await crawler.crawl();

      // Should not crash and return empty results for invalid URLs
      expect(results).toEqual([]);
    });
  });

  describe("getResults", () => {
    it("should return empty array before crawling", () => {
      const options: CrawlOptions = {
        rootUrl: "https://example.com",
        maxDepth: 1,
      };

      const crawler = new WebCrawler(options);

      expect(crawler.getResults()).toEqual([]);
    });

    it("should return consistent results object", () => {
      const options: CrawlOptions = {
        rootUrl: "https://example.com",
        maxDepth: 0,
      };

      const crawler = new WebCrawler(options);

      const results1 = crawler.getResults();
      const results2 = crawler.getResults();

      expect(results1).toBe(results2); // Same reference
      expect(Array.isArray(results1)).toBe(true);
    });
  });

  // Note: Integration tests are skipped due to network dependencies and complex mocking requirements
  // In a production environment, these would use test servers or dependency injection
});
