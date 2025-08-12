# Web Crawler Usage

## Prerequisites

This project requires [Bun](https://bun.sh/) (a fast JavaScript runtime).  
If you don't have Bun installed, follow the instructions at [https://bun.sh/docs/installation](https://bun.sh/docs/installation):

## Quick Start

```bash
# Install dependencies
bun install

# Run the crawler
bun run index.ts <root_url> <max_depth> [max_workers]

# Run tests
bun test
```

## Examples

```bash
# Crawl example.com with max depth 2 (uses all CPU cores automatically)
bun run index.ts https://example.com 2

# Crawl with specific number of worker threads (must not exceed CPU cores)
bun run index.ts https://example.com 2 4

# Force single-threaded mode (useful for debugging or resource constraints)
bun run index.ts https://example.com 2 1

# Crawl a local development server
bun run index.ts http://localhost:3000 1

# Crawl Wikipedia starting page with depth 3
bun run index.ts https://en.wikipedia.org/wiki/Main_Page 3
```

### ⚠️ Important Worker Constraints

- **Max workers limit**: Cannot exceed available CPU cores (system has X cores = max X workers)
- **Single-threaded mode**: Use `max_workers=1` to force single-threaded crawling
- **Auto-detection**: Without specifying workers, uses (CPU cores - 1) for optimal performance
- **Error handling**: System validates worker count and provides clear error messages

## Output

The crawler generates:

1. **Console output**: Real-time progress, final results, and performance metrics
2. **TSV file**: Stored in the `outputs` folder using as file name the website base url + timestamp with columns:
   - Url
   - depth (0 = root page)
   - ratio (0.0 to 1.0, same-domain link ratio)

### Performance Metrics

The crawler automatically tracks and displays:

- **Total crawling time**: In both seconds and milliseconds
- **Average time per page**: Helps identify performance bottlenecks
- **Performance mode**: Shows whether parallel or single-threaded mode was used
- **Worker information**: Number of workers used (manual or auto-detected)

## Testing

This project has **comprehensive unit test coverage** with 96 tests covering all core functionality:

```bash
# Run all tests (96 tests, ~663ms)
bun test

# Run tests in watch mode
bun test --watch
```

- **Types**: Interface validation and compatibility tests
- **URL utilities**: Domain checking, URL validation, and resolution
- **HTML parsing**: Link extraction with JSDOM and regex fallback
- **HTTP handling**: Request management, timeouts, and error handling
- **Output generation**: TSV formatting and filename generation
- **Core crawler**: Constructor, configuration, and basic crawling logic

See [`TEST_COVERAGE.md`](./TEST_COVERAGE.md) for detailed coverage information.

## Features

- ✅ **Multi-core CPU utilization**: Automatically detects and uses all available CPU cores
- ✅ **Worker thread architecture**: True parallel processing using Node.js worker threads
- ✅ **Intelligent load balancing**: Distributes crawling work evenly across workers
- ✅ **Comprehensive test suite**: 96+ tests with ~100% coverage of utilities
- ✅ **Configurable parallelism**: Control number of worker threads or use auto-detection
- ✅ **Same-domain detection**: Exact subdomain matching (www.foo.com ≠ baz.foo.com)
- ✅ **Error handling**: Graceful handling of failed requests and invalid URLs
- ✅ **Performance optimized**: Uses all available machine resources efficiently
- ✅ **TSV output**: Tab-separated values for easy data processing
- ✅ **Timeout protection**: 10-second timeout per page request
- ✅ **Modular architecture**: Well-organized code structure for easy maintenance

## Code Architecture

The crawler is organized into focused modules:

```
src/
├── cli.ts                      # Command line argument parsing
├── types/index.ts              # TypeScript interfaces and types
├── utils/                      # Utility functions
│   ├── url.ts                 # URL validation and domain checking
│   ├── http.ts                # HTTP fetching with error handling
│   ├── html.ts                # HTML parsing and link extraction
│   └── system.ts              # CPU core detection and worker management
├── crawler/                    # Crawling engines
│   ├── crawler.ts             # Single-threaded crawler (fallback)
│   ├── parallel-crawler.ts    # Multi-core parallel crawler
│   └── worker.ts              # Worker thread implementation
└── output/tsv.ts              # TSV generation and file output
```

## Performance & CPU Utilization

The crawler automatically detects your system's CPU cores and creates worker threads to maximize performance:

- **Automatic detection**: Uses `os.cpus().length` to detect available cores
- **Optimal worker count**: Uses (CPU cores - 1) to keep one core free for the main process
- **Manual override**: Specify `max_workers` parameter to control worker count
- **Intelligent fallback**: Uses single-threaded crawler on single-core systems
- **Load balancing**: Distributes URLs evenly across worker threads
- **Memory efficient**: Worker threads share memory space for better resource usage

### Performance Example

On a 8-core machine:

- **Single-threaded**: Processes 1 page at a time
- **Parallel**: Processes up to 7 pages simultaneously (7 workers + 1 main thread)
- **Expected speedup**: 5-7x faster crawling for large websites

### Sample Performance Output

```
=== PERFORMANCE ===
Total crawling time: 2.34s (2340ms)
Average time per page: 78.00ms
Performance mode: Parallel (auto-detected (7) workers)
```

**Note**: For small crawling jobs (< 10 pages), single-threaded mode may be faster due to worker thread overhead. The system automatically chooses the best approach.

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
