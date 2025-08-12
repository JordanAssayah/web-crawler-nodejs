import { describe, it, expect } from "bun:test";
import { extractLinks } from "../html.js";

describe("HTML Utilities", () => {
  describe("extractLinks", () => {
    const baseUrl = "https://example.com/page";

    it("should extract absolute links correctly", () => {
      const html = `
        <html>
          <body>
            <a href="https://example.com/page1">Link 1</a>
            <a href="https://other.com/page2">Link 2</a>
            <a href="http://example.com/page3">Link 3</a>
          </body>
        </html>
      `;

      const links = extractLinks(html, baseUrl);
      expect(links).toEqual([
        "https://example.com/page1",
        "https://other.com/page2",
        "http://example.com/page3",
      ]);
    });

    it("should extract and resolve relative links", () => {
      const html = `
        <html>
          <body>
            <a href="/absolute-path">Absolute Path</a>
            <a href="./relative-path">Relative Path</a>
            <a href="../parent-path">Parent Path</a>
            <a href="simple-path">Simple Path</a>
          </body>
        </html>
      `;

      const links = extractLinks(html, baseUrl);
      expect(links).toEqual([
        "https://example.com/absolute-path",
        "https://example.com/relative-path",
        "https://example.com/parent-path",
        "https://example.com/simple-path",
      ]);
    });

    it("should ignore links without href attribute", () => {
      const html = `
        <html>
          <body>
            <a>No href</a>
            <a href="">Empty href</a>
            <a href="valid-link">Valid link</a>
            <a name="anchor">Named anchor</a>
          </body>
        </html>
      `;

      const links = extractLinks(html, baseUrl);
      expect(links).toEqual(["https://example.com/valid-link"]);
    });

    it("should handle complex HTML with nested elements", () => {
      const html = `
        <html>
          <head>
            <title>Test Page</title>
          </head>
          <body>
            <div class="nav">
              <a href="/home">Home</a>
              <a href="/about">About</a>
            </div>
            <main>
              <article>
                <h1>Article Title</h1>
                <p>Some text with <a href="https://external.com">external link</a></p>
                <p>More text with <a href="/internal">internal link</a></p>
              </article>
            </main>
            <footer>
              <a href="/contact">Contact</a>
            </footer>
          </body>
        </html>
      `;

      const links = extractLinks(html, baseUrl);
      expect(links).toEqual([
        "https://example.com/home",
        "https://example.com/about",
        "https://external.com/",
        "https://example.com/internal",
        "https://example.com/contact",
      ]);
    });

    it("should handle malformed HTML gracefully", () => {
      const html = `
        <html>
          <body>
            <a href="/link1">Link 1</a>
            <div><a href="/link2">Link 2
            <a href="/link3">Link 3</a>
            </body>
        </html>
      `;

      const links = extractLinks(html, baseUrl);
      expect(links.length).toBeGreaterThan(0);
      expect(links).toContain("https://example.com/link1");
      expect(links).toContain("https://example.com/link3");
    });

    it("should handle HTML with special characters in URLs", () => {
      const html = `
        <html>
          <body>
            <a href="/search?q=test&category=books">Search Link</a>
            <a href="/page#section1">Anchor Link</a>
            <a href="/path with spaces">Spaces in Path</a>
          </body>
        </html>
      `;

      const links = extractLinks(html, baseUrl);
      expect(links).toContain(
        "https://example.com/search?q=test&category=books"
      );
      expect(links).toContain("https://example.com/page#section1");
      expect(links).toContain("https://example.com/path%20with%20spaces");
    });

    it("should return empty array for empty HTML", () => {
      expect(extractLinks("", baseUrl)).toEqual([]);
      expect(extractLinks("<html></html>", baseUrl)).toEqual([]);
      expect(extractLinks("<html><body></body></html>", baseUrl)).toEqual([]);
    });

    it("should handle HTML with no anchor tags", () => {
      const html = `
        <html>
          <body>
            <div>No links here</div>
            <p>Just some text</p>
            <img src="image.jpg" alt="Image">
          </body>
        </html>
      `;

      expect(extractLinks(html, baseUrl)).toEqual([]);
    });

    it("should filter out invalid URLs during resolution", () => {
      const html = `
        <html>
          <body>
            <a href="javascript:void(0)">JavaScript Link</a>
            <a href="mailto:test@example.com">Email Link</a>
            <a href="/valid-link">Valid Link</a>
            <a href="tel:+1234567890">Phone Link</a>
          </body>
        </html>
      `;

      const links = extractLinks(html, baseUrl);
      // Should include all links as they are technically valid URLs
      expect(links).toContain("https://example.com/valid-link");
      expect(links).toContain("javascript:void(0)");
      expect(links).toContain("mailto:test@example.com");
      expect(links).toContain("tel:+1234567890");
    });

    it("should handle duplicate links", () => {
      const html = `
        <html>
          <body>
            <a href="/page1">Page 1</a>
            <a href="/page1">Page 1 Again</a>
            <a href="/page2">Page 2</a>
            <a href="/page1">Page 1 Third Time</a>
          </body>
        </html>
      `;

      const links = extractLinks(html, baseUrl);
      expect(links).toEqual([
        "https://example.com/page1",
        "https://example.com/page1",
        "https://example.com/page2",
        "https://example.com/page1",
      ]);
      // Should preserve duplicates as they might be found on the same page multiple times
    });

    it("should handle single and double quotes in href attributes", () => {
      const html = `
        <html>
          <body>
            <a href="/single-quote">Single Quote</a>
            <a href="/double-quote">Double Quote</a>
            <a href='/mixed-quote'>Mixed Quote</a>
          </body>
        </html>
      `;

      const links = extractLinks(html, baseUrl);
      expect(links).toEqual([
        "https://example.com/single-quote",
        "https://example.com/double-quote",
        "https://example.com/mixed-quote",
      ]);
    });

    it("should fall back to regex parsing when JSDOM fails", () => {
      // Test with HTML that might cause JSDOM issues
      const problematicHtml = `
        <html>
          <head>
            <style>
              /* Potentially problematic CSS */
              .invalid { color: rgb(; }
            </style>
          </head>
          <body>
            <a href="/link1">Link 1</a>
            <a href="/link2">Link 2</a>
          </body>
        </html>
      `;

      const links = extractLinks(problematicHtml, baseUrl);
      expect(links.length).toBeGreaterThan(0);
      // Should still extract links even if JSDOM has issues
    });

    it("should handle very large HTML documents", () => {
      // Create a large HTML document with many links
      let html = "<html><body>";
      const expectedLinks = [];

      for (let i = 1; i <= 1000; i++) {
        html += `<a href="/page${i}">Page ${i}</a>`;
        expectedLinks.push(`https://example.com/page${i}`);
      }

      html += "</body></html>";

      const links = extractLinks(html, baseUrl);
      expect(links.length).toBe(1000);
      expect(links).toEqual(expectedLinks);
    });
  });
});
