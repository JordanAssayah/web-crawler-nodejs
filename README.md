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

1. **Structured JSON logs**: Real-time progress with Pino structured logging for monitoring
2. **Console output**: Summary results and performance metrics
3. **TSV file**: Stored in the `outputs` folder using as file name the website base url + timestamp with columns:
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
- **HTML parsing**: Link extraction with Cheerio and regex fallback
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
- ✅ **Structured logging**: Enterprise-grade JSON logging with Pino for monitoring and debugging
- ✅ **Fast HTML parsing**: Uses Cheerio for efficient link extraction (3-5x faster than JSDOM)

## Code Architecture

The following diagram illustrates the application logic and flow:

![Web Crawler Logic Flow](https://mermaid.ink/svg/pako:eNqFVG1TGjEQ_is76UxHR0VePIGb1hk4wDcQBLS0vX5IYQ9uPC40yVWt-t-7yXm82Y73IUOyz_Pss0s2T2wsJshcNpV8MYNh3Y-Bvtp3n90olNBPYgWe5PcRyk8_5eGJ1z6Hmpwmc4y18tkPODg4gTrBs0O45VE44ToUcUro3YAnJEIDNY7NMbHSLHVL9ojcQxkIOefxGGEYzinxQHOprcBiFcvF4n5nd8n3LL_x5DNvJoTCzCh0qCbLrXOFExAxGBdjcqHgI8z5wxch71CS_5dUKV0bRu_ZZysAfIaCz56hSR4HYTyN8EDPJPIJqa53ZYC_Eqo95BH0pBijUgRe-sx0VyZOoLBhxByYPC3TCy55FGG0kSDFwdAmh54Q0VI9XZu2F6fEPxsOe9A3hpQ25Z4NO20gUWPJanVjhAWfInANHDS1e0urZbXOSGszbWGJSxHnbxDFLcTFG8TVVq4zi7vMfO-92n3bxHMLbL8PvLDAzvvAdD218CuC91ElEbXME9T-zZt6mYLSTXt901nfpOuVPer-81o340k6FTwaJxHXNBaJ5Bu5upbeI_pwcAutMEI4xRjlaqQyo3tGdL2inqVeE9UTsRLE7CZ6kegt1rqtDmoZjtVWU66tUN-U0Oy3uv1O7cprQuN80GvXvlq1odB02c3lcWGUG40U7IxGo7natdHa7ynQ3NprRnEDmCsbMaPpQnbHD7eGasuG0o9UQw2CMIrcD1gInADXI95rJCihEzjrkUYWCSiWX490_8vpZ3kqgYMVtk9vYjhhrpYJ7jP68-bcbNmT4fhMz9AMjks_J1ze-cyPX4iz4PE3IeYZTYpkOmNuwCNFu2RBDyM2Qk6v7QqC8QSlJ5JYM9exCsx9Yg_MLVaqueNy2XEKxeOqUyoUKfrI3FI55xwXnXz5uFgtVY-c0ss--2Nz5nOV8lGVvkrlKF-plF7-AlQYyqo)

The crawler is organized into focused modules:

```
src/
├── cli.ts                      # Command line argument parsing
├── types/index.ts              # TypeScript interfaces and types
├── utils/                      # Utility functions
│   ├── url.ts                 # URL validation and domain checking
│   ├── http.ts                # HTTP fetching with error handling
│   ├── html.ts                # HTML parsing and link extraction (Cheerio)
│   ├── logger.ts              # Structured logging configuration (Pino)
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

## Structured Logging

The crawler uses **Pino** for enterprise-grade structured JSON logging with different log levels and component-specific loggers:

### Log Levels by Environment

- **Test**: Only `WARN` and `ERROR` (clean test output)
- **Development**: `DEBUG` and above (full visibility)
- **Production**: `INFO` and above (balanced monitoring)

### Component Loggers

- **HTTP Logger**: Request/response details, timeouts, errors
- **Crawler Logger**: Crawl progress, page processing, performance metrics
- **Worker Logger**: Worker thread lifecycle and task processing
- **HTML Logger**: Link extraction and parsing issues
- **System Logger**: CPU detection and worker management

### Sample Log Output

```json
{
  "level": 30,
  "time": 1754987640348,
  "service": "web-crawler",
  "version": "1.0.0",
  "component": "http",
  "url": "https://example.com",
  "status": 200,
  "msg": "Page fetched successfully"
}
```

### Log Analysis

```bash
# Filter by component
node crawler.js | jq 'select(.component == "http")'

# Show only errors and warnings
node crawler.js | jq 'select(.level >= 40)'

# Monitor worker performance
node crawler.js | jq 'select(.workerId)'
```

This structured approach enables:

- **Production monitoring** with log aggregation systems
- **Performance analysis** through structured metrics
- **Debugging** with rich contextual information
- **Clean testing** with appropriate log level filtering

## Technology Stack

- **Runtime**: [Bun](https://bun.sh/) - Fast JavaScript runtime and package manager
- **HTML Parsing**: [Cheerio](https://cheerio.js.org/) - Server-side jQuery-like HTML parsing (3-5x faster than JSDOM)
- **Logging**: [Pino](https://getpino.io/) - High-performance structured JSON logging
- **Concurrency**: Node.js Worker Threads for true parallel processing
- **TypeScript**: Full type safety and modern JavaScript features

## Same-Domain Logic

Links are considered same-domain if they have identical:

- Protocol (http/https)
- Hostname (including subdomain)

Examples for root URL `http://www.foo.com`:

- ✅ Same domain: `http://www.foo.com/page.html`
- ❌ Different domain: `http://baz.foo.com/page.html`
- ❌ Different domain: `https://www.foo.com/page.html`
