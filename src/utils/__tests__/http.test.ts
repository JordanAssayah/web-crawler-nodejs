import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { fetchPage } from "../http.js";

// Mock the global fetch function
const mockFetch = mock();
global.fetch = mockFetch as any;

describe("HTTP Utilities", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    mockFetch.mockClear();
  });

  describe("fetchPage", () => {
    it("should fetch HTML content successfully", async () => {
      const mockHtml = "<html><body>Test content</body></html>";
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: {
          get: mock((header) => {
            if (header === "content-type") return "text/html; charset=utf-8";
            return null;
          }),
        },
        text: mock().mockResolvedValue(mockHtml),
      });

      const result = await fetchPage("https://example.com");

      expect(result).toBe(mockHtml);
      expect(mockFetch).toHaveBeenCalledWith("https://example.com", {
        headers: {
          "User-Agent": "Web-Crawler-Bot/1.0",
        },
        signal: expect.any(AbortSignal),
      });
    });

    it("should use custom user agent when provided", async () => {
      const mockHtml = "<html><body>Test</body></html>";
      mockFetch.mockResolvedValue({
        ok: true,
        headers: {
          get: mock(() => "text/html"),
        },
        text: mock().mockResolvedValue(mockHtml),
      });

      await fetchPage("https://example.com", { userAgent: "Custom-Bot/2.0" });

      expect(mockFetch).toHaveBeenCalledWith("https://example.com", {
        headers: {
          "User-Agent": "Custom-Bot/2.0",
        },
        signal: expect.any(AbortSignal),
      });
    });

    it("should use custom timeout when provided", async () => {
      const mockHtml = "<html><body>Test</body></html>";
      mockFetch.mockResolvedValue({
        ok: true,
        headers: {
          get: mock(() => "text/html"),
        },
        text: mock().mockResolvedValue(mockHtml),
      });

      await fetchPage("https://example.com", { timeout: 5000 });

      expect(mockFetch).toHaveBeenCalledWith("https://example.com", {
        headers: {
          "User-Agent": "Web-Crawler-Bot/1.0",
        },
        signal: expect.any(AbortSignal),
      });
    });

    it("should return null for non-OK HTTP responses", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      // Suppress console.error during this test
      const originalConsoleError = console.error;
      console.error = () => {};

      const result = await fetchPage("https://example.com/nonexistent");

      // Restore console.error
      console.error = originalConsoleError;

      expect(result).toBe(null);
    });

    it("should return null for non-HTML content types", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: {
          get: mock((header) => {
            if (header === "content-type") return "application/json";
            return null;
          }),
        },
      });

      // Suppress console.error during this test
      const originalConsoleError = console.error;
      console.error = () => {};

      const result = await fetchPage("https://example.com/api/data");

      // Restore console.error
      console.error = originalConsoleError;

      expect(result).toBe(null);
    });

    it("should return null when content-type header is missing", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: {
          get: mock(() => null),
        },
      });

      // Suppress console.error during this test
      const originalConsoleError = console.error;
      console.error = () => {};

      const result = await fetchPage("https://example.com");

      // Restore console.error
      console.error = originalConsoleError;

      expect(result).toBe(null);
    });

    it("should handle network errors gracefully", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      // Suppress console.error during this test
      const originalConsoleError = console.error;
      console.error = () => {};

      const result = await fetchPage("https://unreachable.com");

      // Restore console.error
      console.error = originalConsoleError;

      expect(result).toBe(null);
    });

    it("should handle timeout errors gracefully", async () => {
      mockFetch.mockRejectedValue(
        new DOMException("The operation was aborted", "AbortError")
      );

      // Suppress console.error during this test
      const originalConsoleError = console.error;
      console.error = () => {};

      const result = await fetchPage("https://slow.com");

      // Restore console.error
      console.error = originalConsoleError;

      expect(result).toBe(null);
    });

    it("should skip likely file URLs", async () => {
      const fileUrls = [
        "https://example.com/document.pdf",
        "https://example.com/image.jpg",
        "https://example.com/video.mp4",
        "https://example.com/archive.zip",
        "https://example.com/script.js",
        "https://example.com/style.css",
      ];

      // Suppress console.error during this test
      const originalConsoleError = console.error;
      console.error = () => {};

      for (const url of fileUrls) {
        const result = await fetchPage(url);
        expect(result).toBe(null);
        expect(mockFetch).not.toHaveBeenCalledWith(
          expect.stringContaining(url),
          expect.any(Object)
        );
      }

      // Restore console.error
      console.error = originalConsoleError;
    });

    it("should crawl HTML-like file extensions", async () => {
      const mockHtml = "<html><body>Test</body></html>";
      mockFetch.mockResolvedValue({
        ok: true,
        headers: {
          get: mock(() => "text/html"),
        },
        text: mock().mockResolvedValue(mockHtml),
      });

      const htmlUrls = [
        "https://example.com/page.html",
        "https://example.com/page.htm",
        "https://example.com/page.php",
        "https://example.com/page.asp",
        "https://example.com/page.aspx",
        "https://example.com/page.jsp",
      ];

      for (const url of htmlUrls) {
        mockFetch.mockClear();
        const result = await fetchPage(url);
        expect(mockFetch).toHaveBeenCalledWith(url, expect.any(Object));
      }
    });

    it("should crawl URLs without file extensions", async () => {
      const mockHtml = "<html><body>Test</body></html>";
      mockFetch.mockResolvedValue({
        ok: true,
        headers: {
          get: mock(() => "text/html"),
        },
        text: mock().mockResolvedValue(mockHtml),
      });

      const urls = [
        "https://example.com/page",
        "https://example.com/category/item",
        "https://example.com/blog/post-title",
        "https://example.com/",
      ];

      for (const url of urls) {
        mockFetch.mockClear();
        const result = await fetchPage(url);
        expect(mockFetch).toHaveBeenCalledWith(url, expect.any(Object));
      }
    });

    it("should handle various content-type formats", async () => {
      const mockHtml = "<html><body>Test</body></html>";

      const contentTypes = [
        "text/html",
        "text/html; charset=utf-8",
        "text/html; charset=UTF-8",
        "text/html;charset=utf-8",
      ];

      for (const contentType of contentTypes) {
        mockFetch.mockClear();
        mockFetch.mockResolvedValue({
          ok: true,
          headers: {
            get: mock((header) => {
              if (header.toLowerCase() === "content-type") return contentType;
              return null;
            }),
          },
          text: mock().mockResolvedValue(mockHtml),
        });

        const result = await fetchPage("https://example.com");
        expect(result).toBe(mockHtml);
      }
    });

    it("should handle response.text() errors", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: {
          get: mock(() => "text/html"),
        },
        text: mock().mockRejectedValue(
          new Error("Failed to read response body")
        ),
      });

      // Suppress console.error during this test
      const originalConsoleError = console.error;
      console.error = () => {};

      const result = await fetchPage("https://example.com");

      // Restore console.error
      console.error = originalConsoleError;

      expect(result).toBe(null);
    });

    it("should handle URLs with query parameters and fragments", async () => {
      const mockHtml = "<html><body>Test</body></html>";
      mockFetch.mockResolvedValue({
        ok: true,
        headers: {
          get: mock(() => "text/html"),
        },
        text: mock().mockResolvedValue(mockHtml),
      });

      const complexUrls = [
        "https://example.com/page?param=value",
        "https://example.com/page#section",
        "https://example.com/page?param=value&other=test#section",
        "https://example.com/search?q=test%20query",
      ];

      for (const url of complexUrls) {
        mockFetch.mockClear();
        const result = await fetchPage(url);
        expect(mockFetch).toHaveBeenCalledWith(url, expect.any(Object));
        expect(result).toBe(mockHtml);
      }
    });
  });

  describe("File URL Detection", () => {
    // Since isLikelyFileUrl is not exported, we test it indirectly through fetchPage
    it("should correctly identify and skip various file types", async () => {
      const fileTypes = [
        // Images
        "https://example.com/image.jpg",
        "https://example.com/image.jpeg",
        "https://example.com/image.png",
        "https://example.com/image.gif",
        "https://example.com/image.svg",
        "https://example.com/image.webp",

        // Documents
        "https://example.com/document.pdf",
        "https://example.com/document.doc",
        "https://example.com/document.docx",
        "https://example.com/document.txt",

        // Archives
        "https://example.com/archive.zip",
        "https://example.com/archive.rar",
        "https://example.com/archive.tar.gz",

        // Media
        "https://example.com/video.mp4",
        "https://example.com/audio.mp3",

        // Scripts and styles
        "https://example.com/script.js",
        "https://example.com/style.css",

        // Other
        "https://example.com/data.json",
        "https://example.com/data.xml",
        "https://example.com/feed.rss",
      ];

      // Suppress console.error during this test
      const originalConsoleError = console.error;
      console.error = () => {};

      for (const url of fileTypes) {
        const result = await fetchPage(url);
        expect(result).toBe(null);
        expect(mockFetch).not.toHaveBeenCalledWith(url, expect.any(Object));
      }

      // Restore console.error
      console.error = originalConsoleError;
    });

    it("should handle case-insensitive file extensions", async () => {
      const mixedCaseUrls = [
        "https://example.com/IMAGE.JPG",
        "https://example.com/Document.PDF",
        "https://example.com/Script.JS",
        "https://example.com/Style.CSS",
      ];

      // Suppress console.error during this test
      const originalConsoleError = console.error;
      console.error = () => {};

      for (const url of mixedCaseUrls) {
        const result = await fetchPage(url);
        expect(result).toBe(null);
        expect(mockFetch).not.toHaveBeenCalledWith(url, expect.any(Object));
      }

      // Restore console.error
      console.error = originalConsoleError;
    });
  });
});
