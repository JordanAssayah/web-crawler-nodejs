import { describe, it, expect } from "bun:test";
import type { CrawlResult, PageData, CrawlOptions } from "../index.js";

describe("Type Definitions", () => {
  describe("CrawlResult", () => {
    it("should have all required properties", () => {
      const crawlResult: CrawlResult = {
        url: "https://example.com",
        depth: 1,
        ratio: 0.75,
      };

      expect(crawlResult.url).toBe("https://example.com");
      expect(crawlResult.depth).toBe(1);
      expect(crawlResult.ratio).toBe(0.75);
    });

    it("should accept valid URL strings", () => {
      const validUrls = [
        "https://example.com",
        "http://localhost:3000",
        "https://subdomain.example.com/path?query=value#anchor",
        "https://example.com/path/to/page",
      ];

      validUrls.forEach((url) => {
        const result: CrawlResult = {
          url,
          depth: 0,
          ratio: 1.0,
        };
        expect(result.url).toBe(url);
      });
    });

    it("should accept valid depth values", () => {
      const validDepths = [0, 1, 2, 5, 10, 100];

      validDepths.forEach((depth) => {
        const result: CrawlResult = {
          url: "https://example.com",
          depth,
          ratio: 0.5,
        };
        expect(result.depth).toBe(depth);
      });
    });

    it("should accept valid ratio values", () => {
      const validRatios = [0, 0.25, 0.5, 0.75, 1.0, 0.333333];

      validRatios.forEach((ratio) => {
        const result: CrawlResult = {
          url: "https://example.com",
          depth: 0,
          ratio,
        };
        expect(result.ratio).toBe(ratio);
      });
    });

    it("should work with array of results", () => {
      const results: CrawlResult[] = [
        { url: "https://example.com", depth: 0, ratio: 1.0 },
        { url: "https://example.com/page1", depth: 1, ratio: 0.8 },
        { url: "https://example.com/page2", depth: 1, ratio: 0.6 },
      ];

      expect(results).toHaveLength(3);
      expect(results[0].depth).toBe(0);
      expect(results[1].depth).toBe(1);
      expect(results[2].depth).toBe(1);
    });
  });

  describe("PageData", () => {
    it("should have all required properties", () => {
      const pageData: PageData = {
        url: "https://example.com",
        depth: 1,
        links: ["https://example.com/page1", "https://example.com/page2"],
      };

      expect(pageData.url).toBe("https://example.com");
      expect(pageData.depth).toBe(1);
      expect(pageData.links).toEqual([
        "https://example.com/page1",
        "https://example.com/page2",
      ]);
    });

    it("should accept empty links array", () => {
      const pageData: PageData = {
        url: "https://example.com",
        depth: 0,
        links: [],
      };

      expect(pageData.links).toEqual([]);
      expect(pageData.links).toHaveLength(0);
    });

    it("should accept large links arrays", () => {
      const links = Array.from(
        { length: 1000 },
        (_, i) => `https://example.com/page${i}`
      );

      const pageData: PageData = {
        url: "https://example.com",
        depth: 0,
        links,
      };

      expect(pageData.links).toHaveLength(1000);
      expect(pageData.links[0]).toBe("https://example.com/page0");
      expect(pageData.links[999]).toBe("https://example.com/page999");
    });

    it("should accept various URL formats in links", () => {
      const pageData: PageData = {
        url: "https://example.com",
        depth: 1,
        links: [
          "https://example.com/absolute",
          "http://example.com/http",
          "https://other.com/external",
          "https://subdomain.example.com/sub",
          "https://example.com/path?query=value",
          "https://example.com/path#anchor",
        ],
      };

      expect(pageData.links).toHaveLength(6);
      pageData.links.forEach((link) => {
        expect(typeof link).toBe("string");
      });
    });

    it("should work with different depth levels", () => {
      const pageDataList: PageData[] = [
        {
          url: "https://example.com",
          depth: 0,
          links: ["https://example.com/l1"],
        },
        {
          url: "https://example.com/l1",
          depth: 1,
          links: ["https://example.com/l2"],
        },
        { url: "https://example.com/l2", depth: 2, links: [] },
      ];

      expect(pageDataList).toHaveLength(3);
      expect(pageDataList[0].depth).toBe(0);
      expect(pageDataList[1].depth).toBe(1);
      expect(pageDataList[2].depth).toBe(2);
    });
  });

  describe("CrawlOptions", () => {
    it("should have required properties", () => {
      const options: CrawlOptions = {
        rootUrl: "https://example.com",
        maxDepth: 2,
      };

      expect(options.rootUrl).toBe("https://example.com");
      expect(options.maxDepth).toBe(2);
    });

    it("should accept optional batchSize", () => {
      const options: CrawlOptions = {
        rootUrl: "https://example.com",
        maxDepth: 2,
        batchSize: 5,
      };

      expect(options.batchSize).toBe(5);
    });

    it("should accept optional timeout", () => {
      const options: CrawlOptions = {
        rootUrl: "https://example.com",
        maxDepth: 2,
        timeout: 15000,
      };

      expect(options.timeout).toBe(15000);
    });

    it("should accept both optional properties", () => {
      const options: CrawlOptions = {
        rootUrl: "https://example.com",
        maxDepth: 3,
        batchSize: 8,
        timeout: 20000,
      };

      expect(options.rootUrl).toBe("https://example.com");
      expect(options.maxDepth).toBe(3);
      expect(options.batchSize).toBe(8);
      expect(options.timeout).toBe(20000);
    });

    it("should work without optional properties", () => {
      const options: CrawlOptions = {
        rootUrl: "https://test.com",
        maxDepth: 1,
      };

      expect(options.batchSize).toBeUndefined();
      expect(options.timeout).toBeUndefined();
    });

    it("should accept various URL formats for rootUrl", () => {
      const urlFormats = [
        "https://example.com",
        "http://localhost:3000",
        "https://subdomain.example.com",
        "https://example.com/path",
        "https://example.com:8080",
      ];

      urlFormats.forEach((rootUrl) => {
        const options: CrawlOptions = {
          rootUrl,
          maxDepth: 1,
        };
        expect(options.rootUrl).toBe(rootUrl);
      });
    });

    it("should accept various maxDepth values", () => {
      const depths = [0, 1, 2, 5, 10, 50];

      depths.forEach((maxDepth) => {
        const options: CrawlOptions = {
          rootUrl: "https://example.com",
          maxDepth,
        };
        expect(options.maxDepth).toBe(maxDepth);
      });
    });

    it("should accept various batchSize values", () => {
      const batchSizes = [1, 5, 10, 20, 50, 100];

      batchSizes.forEach((batchSize) => {
        const options: CrawlOptions = {
          rootUrl: "https://example.com",
          maxDepth: 2,
          batchSize,
        };
        expect(options.batchSize).toBe(batchSize);
      });
    });

    it("should accept various timeout values", () => {
      const timeouts = [1000, 5000, 10000, 30000, 60000];

      timeouts.forEach((timeout) => {
        const options: CrawlOptions = {
          rootUrl: "https://example.com",
          maxDepth: 2,
          timeout,
        };
        expect(options.timeout).toBe(timeout);
      });
    });
  });

  describe("Type compatibility and usage", () => {
    it("should allow CrawlResult to be created from PageData", () => {
      const pageData: PageData = {
        url: "https://example.com",
        depth: 1,
        links: ["https://example.com/link1", "https://example.com/link2"],
      };

      // Simulate creating a CrawlResult from PageData
      const crawlResult: CrawlResult = {
        url: pageData.url,
        depth: pageData.depth,
        ratio: pageData.links.length > 0 ? 0.5 : 0,
      };

      expect(crawlResult.url).toBe(pageData.url);
      expect(crawlResult.depth).toBe(pageData.depth);
      expect(crawlResult.ratio).toBe(0.5);
    });

    it("should work with functions that process these types", () => {
      // Example function signatures that might use these types
      const processResults = (results: CrawlResult[]): number => {
        return results.reduce((sum, result) => sum + result.ratio, 0);
      };

      const createPageData = (
        url: string,
        depth: number,
        links: string[]
      ): PageData => {
        return { url, depth, links };
      };

      const createOptions = (
        rootUrl: string,
        maxDepth: number
      ): CrawlOptions => {
        return { rootUrl, maxDepth };
      };

      // Test function usage
      const results: CrawlResult[] = [
        { url: "https://example.com", depth: 0, ratio: 1.0 },
        { url: "https://example.com/page", depth: 1, ratio: 0.5 },
      ];

      const totalRatio = processResults(results);
      expect(totalRatio).toBe(1.5);

      const pageData = createPageData("https://test.com", 1, [
        "https://test.com/link",
      ]);
      expect(pageData.url).toBe("https://test.com");

      const options = createOptions("https://crawl.com", 3);
      expect(options.rootUrl).toBe("https://crawl.com");
      expect(options.maxDepth).toBe(3);
    });

    it("should support type guards and validation patterns", () => {
      const isValidCrawlResult = (obj: any): obj is CrawlResult => {
        return (
          typeof obj === "object" &&
          typeof obj.url === "string" &&
          typeof obj.depth === "number" &&
          typeof obj.ratio === "number"
        );
      };

      const isValidPageData = (obj: any): obj is PageData => {
        return (
          typeof obj === "object" &&
          typeof obj.url === "string" &&
          typeof obj.depth === "number" &&
          Array.isArray(obj.links)
        );
      };

      const validCrawlResult = {
        url: "https://example.com",
        depth: 1,
        ratio: 0.5,
      };
      const invalidCrawlResult = {
        url: "https://example.com",
        depth: "1",
        ratio: 0.5,
      };

      expect(isValidCrawlResult(validCrawlResult)).toBe(true);
      expect(isValidCrawlResult(invalidCrawlResult)).toBe(false);

      const validPageData = { url: "https://example.com", depth: 1, links: [] };
      const invalidPageData = {
        url: "https://example.com",
        depth: 1,
        links: "not-array",
      };

      expect(isValidPageData(validPageData)).toBe(true);
      expect(isValidPageData(invalidPageData)).toBe(false);
    });
  });
});
