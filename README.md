# Web Crawler Usage

## Prerequisites

This project requires [Bun](https://bun.sh/) (a fast JavaScript runtime).  
If you don't have Bun installed, follow the instructions at [https://bun.sh/docs/installation](https://bun.sh/docs/installation):

## Quick Start

```bash
# Install dependencies
bun install

# Run the crawler
bun run index.ts <root_url> <max_depth>
```

## Examples

```bash
# Crawl example.com with max depth 2
bun run index.ts https://example.com 2

# Crawl a local development server
bun run index.ts http://localhost:3000 1

# Crawl Wikipedia starting page with depth 3
bun run index.ts https://en.wikipedia.org/wiki/Main_Page 3
```

## Output

The crawler generates:

1. **Console output**: Real-time progress and final results
2. **TSV file**: Stored in the `outputs` folder using as file name the website base url + timestamp with columns:
   - Url
   - depth (0 = root page)
   - ratio (0.0 to 1.0, same-domain link ratio)

## Features

- ✅ **Parallel processing**: Processes up to 10 pages simultaneously
- ✅ **Same-domain detection**: Exact subdomain matching (www.foo.com ≠ baz.foo.com)
- ✅ **Error handling**: Graceful handling of failed requests and invalid URLs
- ✅ **Performance optimized**: Uses all available machine resources
- ✅ **TSV output**: Tab-separated values for easy data processing
- ✅ **Timeout protection**: 10-second timeout per page request
- ✅ **Modular architecture**: Well-organized code structure for easy maintenance

## Code Architecture

The crawler is organized into focused modules:

```
src/
├── cli.ts              # Command line argument parsing
├── types/index.ts      # TypeScript interfaces and types
├── utils/              # Utility functions
│   ├── url.ts         # URL validation and domain checking
│   ├── http.ts        # HTTP fetching with error handling
│   └── html.ts        # HTML parsing and link extraction
├── crawler/crawler.ts  # Main crawler engine with parallel processing
└── output/tsv.ts      # TSV generation and file output
```

This modular structure makes it easy to:

- **Modify specific functionality** without touching other parts
- **Add new features** like different output formats or crawling strategies
- **Test individual components** in isolation
- **Understand the codebase** with clear separation of concerns

## Same-Domain Logic

Links are considered same-domain if they have identical:

- Protocol (http/https)
- Hostname (including subdomain)

Examples for root URL `http://www.foo.com`:

- ✅ Same domain: `http://www.foo.com/page.html`
- ❌ Different domain: `http://baz.foo.com/page.html`
- ❌ Different domain: `https://www.foo.com/page.html`
