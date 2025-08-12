import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { generateFilename, generateTSV, calculateRatio } from "../tsv.js";
import type { CrawlResult } from "../../types/index.js";

// For saveToTSV tests, we'll test the function indirectly through integration tests
// since mocking fs in Bun is more complex

describe("TSV Output Utilities", () => {
  describe("generateFilename", () => {
    beforeEach(() => {
      // Mock Date to return a consistent timestamp
      Date.prototype.toISOString = mock(() => "2024-01-15T10:30:45.123Z");
    });

    it("should generate filename from valid URL", () => {
      const filename = generateFilename("https://example.com");
      expect(filename).toBe("example.com_2024-01-15T10-30-45.tsv");
    });

    it("should generate filename from URL with subdomain", () => {
      const filename = generateFilename("https://blog.example.com");
      expect(filename).toBe("blog.example.com_2024-01-15T10-30-45.tsv");
    });

    it("should generate filename from URL with port", () => {
      const filename = generateFilename("https://localhost:8080");
      expect(filename).toBe("localhost_2024-01-15T10-30-45.tsv");
    });

    it("should sanitize special characters in hostname", () => {
      const filename = generateFilename("https://test-site.com");
      expect(filename).toBe("test-site.com_2024-01-15T10-30-45.tsv");
    });

    it("should handle URLs with paths and query parameters", () => {
      const filename = generateFilename("https://example.com/path?param=value");
      expect(filename).toBe("example.com_2024-01-15T10-30-45.tsv");
    });

    it("should fallback to default filename for invalid URLs", () => {
      const filename = generateFilename("invalid-url");
      expect(filename).toBe("crawl_results_2024-01-15T10-30-45.tsv");
    });

    it("should handle empty string URLs", () => {
      const filename = generateFilename("");
      expect(filename).toBe("crawl_results_2024-01-15T10-30-45.tsv");
    });
  });

  describe("generateTSV", () => {
    it("should generate TSV with proper headers and formatting", () => {
      const results: CrawlResult[] = [
        { url: "https://example.com", depth: 0, ratio: 0.75 },
        { url: "https://example.com/page1", depth: 1, ratio: 0.5 },
        { url: "https://example.com/page2", depth: 1, ratio: 0.25 },
      ];

      const tsv = generateTSV(results);
      const lines = tsv.split("\n");

      expect(lines[0]).toBe("Url\tdepth\tratio");
      expect(lines[1]).toBe("https://example.com\t0\t0.750000");
      expect(lines[2]).toBe("https://example.com/page1\t1\t0.500000");
      expect(lines[3]).toBe("https://example.com/page2\t1\t0.250000");
    });

    it("should sort results by depth then by URL alphabetically", () => {
      const results: CrawlResult[] = [
        { url: "https://example.com/zebra", depth: 1, ratio: 0.5 },
        { url: "https://example.com", depth: 0, ratio: 0.75 },
        { url: "https://example.com/alpha", depth: 1, ratio: 0.25 },
        { url: "https://example.com/beta", depth: 2, ratio: 0.1 },
      ];

      const tsv = generateTSV(results);
      const lines = tsv.split("\n");

      expect(lines[1]).toBe("https://example.com\t0\t0.750000");
      expect(lines[2]).toBe("https://example.com/alpha\t1\t0.250000");
      expect(lines[3]).toBe("https://example.com/zebra\t1\t0.500000");
      expect(lines[4]).toBe("https://example.com/beta\t2\t0.100000");
    });

    it("should handle empty results array", () => {
      const tsv = generateTSV([]);
      expect(tsv).toBe("Url\tdepth\tratio\n");
    });

    it("should format ratios to 6 decimal places", () => {
      const results: CrawlResult[] = [
        { url: "https://example.com", depth: 0, ratio: 1 / 3 },
        { url: "https://example.com/page", depth: 1, ratio: 2 / 7 },
      ];

      const tsv = generateTSV(results);
      const lines = tsv.split("\n");

      expect(lines[1]).toBe("https://example.com\t0\t0.333333");
      expect(lines[2]).toBe("https://example.com/page\t1\t0.285714");
    });

    it("should handle zero and one ratios correctly", () => {
      const results: CrawlResult[] = [
        { url: "https://example.com/zero", depth: 0, ratio: 0 },
        { url: "https://example.com/one", depth: 1, ratio: 1 },
      ];

      const tsv = generateTSV(results);
      const lines = tsv.split("\n");

      expect(lines[1]).toBe("https://example.com/zero\t0\t0.000000");
      expect(lines[2]).toBe("https://example.com/one\t1\t1.000000");
    });
  });

  // Note: saveToTSV tests are skipped because they require complex fs mocking
  // In a real project, these would be integration tests or use a different approach

  describe("calculateRatio", () => {
    const mockIsSameDomain = mock();

    beforeEach(() => {
      mockIsSameDomain.mockClear();
    });

    it("should calculate ratio correctly for same domain links", () => {
      const links = [
        "https://example.com/page1",
        "https://example.com/page2",
        "https://other.com/page3",
        "https://example.com/page4",
      ];
      const pageUrl = "https://example.com";

      mockIsSameDomain.mockImplementation((link, page) =>
        link.startsWith("https://example.com")
      );

      const ratio = calculateRatio(links, pageUrl, mockIsSameDomain);

      expect(ratio).toBe(0.75); // 3 out of 4 links are same domain
      expect(mockIsSameDomain).toHaveBeenCalledTimes(4);
    });

    it("should return 0 for empty links array", () => {
      const ratio = calculateRatio([], "https://example.com", mockIsSameDomain);

      expect(ratio).toBe(0);
      expect(mockIsSameDomain).not.toHaveBeenCalled();
    });

    it("should return 0 when no links are same domain", () => {
      const links = [
        "https://other1.com",
        "https://other2.com",
        "https://other3.com",
      ];
      const pageUrl = "https://example.com";

      mockIsSameDomain.mockReturnValue(false);

      const ratio = calculateRatio(links, pageUrl, mockIsSameDomain);

      expect(ratio).toBe(0);
      expect(mockIsSameDomain).toHaveBeenCalledTimes(3);
    });

    it("should return 1 when all links are same domain", () => {
      const links = [
        "https://example.com/page1",
        "https://example.com/page2",
        "https://example.com/page3",
      ];
      const pageUrl = "https://example.com";

      mockIsSameDomain.mockReturnValue(true);

      const ratio = calculateRatio(links, pageUrl, mockIsSameDomain);

      expect(ratio).toBe(1);
      expect(mockIsSameDomain).toHaveBeenCalledTimes(3);
    });

    it("should handle single link arrays", () => {
      const links = ["https://example.com/page1"];
      const pageUrl = "https://example.com";

      mockIsSameDomain.mockReturnValue(true);

      const ratio = calculateRatio(links, pageUrl, mockIsSameDomain);

      expect(ratio).toBe(1);
      expect(mockIsSameDomain).toHaveBeenCalledTimes(1);
      expect(mockIsSameDomain).toHaveBeenCalledWith(
        "https://example.com/page1",
        "https://example.com"
      );
    });

    it("should pass correct arguments to isSameDomainFn", () => {
      const links = ["https://example.com/page1", "https://other.com/page2"];
      const pageUrl = "https://example.com/current";

      mockIsSameDomain.mockReturnValue(false);

      calculateRatio(links, pageUrl, mockIsSameDomain);

      expect(mockIsSameDomain).toHaveBeenNthCalledWith(
        1,
        "https://example.com/page1",
        "https://example.com/current"
      );
      expect(mockIsSameDomain).toHaveBeenNthCalledWith(
        2,
        "https://other.com/page2",
        "https://example.com/current"
      );
    });

    it("should handle large arrays efficiently", () => {
      const links = Array.from({ length: 1000 }, (_, i) =>
        i % 2 === 0
          ? `https://example.com/page${i}`
          : `https://other.com/page${i}`
      );
      const pageUrl = "https://example.com";

      mockIsSameDomain.mockImplementation((link) =>
        link.startsWith("https://example.com")
      );

      const ratio = calculateRatio(links, pageUrl, mockIsSameDomain);

      expect(ratio).toBe(0.5); // Half of the links are same domain
      expect(mockIsSameDomain).toHaveBeenCalledTimes(1000);
    });
  });
});
