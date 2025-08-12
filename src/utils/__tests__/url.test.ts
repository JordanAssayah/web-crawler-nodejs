import { describe, it, expect } from "bun:test";
import { isSameDomain, isValidUrl, resolveUrl } from "../url.js";

describe("URL Utilities", () => {
  describe("isSameDomain", () => {
    const baseUrl = "https://example.com";

    it("should return true for same domain URLs", () => {
      expect(
        isSameDomain(
          "https://example.com/page1",
          "https://example.com/page2",
          baseUrl
        )
      ).toBe(true);
      expect(
        isSameDomain("https://example.com", "https://example.com/", baseUrl)
      ).toBe(true);
      expect(
        isSameDomain(
          "https://example.com/path",
          "https://example.com/other",
          baseUrl
        )
      ).toBe(true);
    });

    it("should return true for same subdomain URLs", () => {
      expect(
        isSameDomain(
          "https://sub.example.com/page1",
          "https://sub.example.com/page2",
          baseUrl
        )
      ).toBe(true);
    });

    it("should return false for different domains", () => {
      expect(
        isSameDomain("https://example.com", "https://other.com", baseUrl)
      ).toBe(false);
      expect(
        isSameDomain("https://example.com", "https://google.com", baseUrl)
      ).toBe(false);
    });

    it("should return false for different subdomains", () => {
      expect(
        isSameDomain(
          "https://sub1.example.com",
          "https://sub2.example.com",
          baseUrl
        )
      ).toBe(false);
      expect(
        isSameDomain("https://example.com", "https://sub.example.com", baseUrl)
      ).toBe(false);
    });

    it("should return false for different protocols", () => {
      expect(
        isSameDomain("https://example.com", "http://example.com", baseUrl)
      ).toBe(false);
    });

    it("should handle relative URLs with base URL", () => {
      const baseUrl = "https://example.com";
      expect(isSameDomain("/page1", "/page2", baseUrl)).toBe(true);
      expect(isSameDomain("page1", "page2", baseUrl)).toBe(true);
    });

    it("should return false for invalid URLs", () => {
      expect(
        isSameDomain("javascript:void(0)", "https://example.com", baseUrl)
      ).toBe(false);
      expect(
        isSameDomain("https://example.com", "javascript:void(0)", baseUrl)
      ).toBe(false);
      expect(
        isSameDomain("mailto:test@example.com", "tel:+1234567890", baseUrl)
      ).toBe(false);
    });

    it("should handle edge cases", () => {
      expect(isSameDomain("", "", baseUrl)).toBe(true); // Both resolve to baseUrl
      expect(isSameDomain("https://example.com", "", baseUrl)).toBe(true); // Empty resolves to baseUrl
      expect(isSameDomain("", "https://example.com", baseUrl)).toBe(true); // Empty resolves to baseUrl
    });
  });

  describe("isValidUrl", () => {
    it("should return true for valid HTTP URLs", () => {
      expect(isValidUrl("https://example.com")).toBe(true);
      expect(isValidUrl("http://example.com")).toBe(true);
      expect(isValidUrl("https://example.com/path")).toBe(true);
      expect(isValidUrl("https://example.com/path?query=value")).toBe(true);
      expect(isValidUrl("https://example.com/path#anchor")).toBe(true);
    });

    it("should return true for valid URLs with ports", () => {
      expect(isValidUrl("https://example.com:8080")).toBe(true);
      expect(isValidUrl("http://localhost:3000")).toBe(true);
    });

    it("should return true for valid URLs with subdomains", () => {
      expect(isValidUrl("https://sub.example.com")).toBe(true);
      expect(isValidUrl("https://api.subdomain.example.com")).toBe(true);
    });

    it("should return false for invalid URLs", () => {
      expect(isValidUrl("invalid-url")).toBe(false);
      expect(isValidUrl("not a url")).toBe(false);
      expect(isValidUrl("")).toBe(false);
      expect(isValidUrl("example.com")).toBe(false); // Missing protocol
      expect(isValidUrl("//example.com")).toBe(false); // Missing protocol
    });

    it("should return true for other valid protocols", () => {
      expect(isValidUrl("ftp://example.com")).toBe(true);
      expect(isValidUrl("file:///path/to/file")).toBe(true);
    });
  });

  describe("resolveUrl", () => {
    const baseUrl = "https://example.com/page";

    it("should resolve relative URLs correctly", () => {
      expect(resolveUrl("./about", baseUrl)).toBe("https://example.com/about");
      expect(resolveUrl("../contact", baseUrl)).toBe(
        "https://example.com/contact"
      );
      expect(resolveUrl("/admin", baseUrl)).toBe("https://example.com/admin");
      expect(resolveUrl("products", baseUrl)).toBe(
        "https://example.com/products"
      );
    });

    it("should return absolute URLs unchanged", () => {
      expect(resolveUrl("https://other.com/page", baseUrl)).toBe(
        "https://other.com/page"
      );
      expect(resolveUrl("http://example.com/other", baseUrl)).toBe(
        "http://example.com/other"
      );
    });

    it("should handle query parameters and anchors", () => {
      expect(resolveUrl("?query=value", baseUrl)).toBe(
        "https://example.com/page?query=value"
      );
      expect(resolveUrl("#anchor", baseUrl)).toBe(
        "https://example.com/page#anchor"
      );
      expect(resolveUrl("page?query=value#anchor", baseUrl)).toBe(
        "https://example.com/page?query=value#anchor"
      );
    });

    it("should return null for invalid URLs", () => {
      // These should cause URL constructor to throw, which we catch and return null
      expect(resolveUrl("\\invalid", "invalid-base")).toBe(null);
    });

    it("should handle base URLs with paths", () => {
      const baseWithPath = "https://example.com/category/subcategory/";
      expect(resolveUrl("item", baseWithPath)).toBe(
        "https://example.com/category/subcategory/item"
      );
      expect(resolveUrl("./item", baseWithPath)).toBe(
        "https://example.com/category/subcategory/item"
      );
      expect(resolveUrl("../item", baseWithPath)).toBe(
        "https://example.com/category/item"
      );
      expect(resolveUrl("/item", baseWithPath)).toBe(
        "https://example.com/item"
      );
    });

    it("should handle edge cases", () => {
      expect(resolveUrl("", baseUrl)).toBe(baseUrl);
      expect(resolveUrl(" ", baseUrl)).toBe("https://example.com/page"); // Space gets normalized
    });

    it("should handle protocol-relative URLs", () => {
      expect(resolveUrl("//other.com/path", baseUrl)).toBe(
        "https://other.com/path"
      );
    });
  });
});
