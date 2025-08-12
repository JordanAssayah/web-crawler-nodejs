import { isValidUrl } from "./utils/url.js";
import { getCpuCoreCount } from "./utils/system.js";

export interface CLIArgs {
  rootUrl: string;
  maxDepth: number;
  maxWorkers?: number;
}

/**
 * Parse and validate command line arguments
 */
export function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);

  if (args.length < 2 || args.length > 3) {
    console.error(
      "Usage: bun run index.ts <root_url> <max_depth> [max_workers]"
    );
    console.error("Example: bun run index.ts http://www.example.com 2");
    console.error("Example: bun run index.ts http://www.example.com 2 4");
    process.exit(1);
  }

  const [rootUrl, maxDepthStr, maxWorkersStr] = args;
  const maxDepth = parseInt(maxDepthStr, 10);
  const maxWorkers = maxWorkersStr ? parseInt(maxWorkersStr, 10) : undefined;

  // Validate arguments
  if (isNaN(maxDepth) || maxDepth < 0) {
    console.error("Error: max_depth must be a non-negative integer");
    process.exit(1);
  }

  if (maxWorkers !== undefined && (isNaN(maxWorkers) || maxWorkers < 1)) {
    console.error("Error: max_workers must be a positive integer");
    process.exit(1);
  }

  if (maxWorkers !== undefined && maxWorkers > getCpuCoreCount()) {
    console.error(
      `Error: max_workers (${maxWorkers}) exceeds available CPU cores (${getCpuCoreCount()})`
    );
    console.error(`Maximum allowed workers: ${getCpuCoreCount()}`);
    process.exit(1);
  }

  if (!isValidUrl(rootUrl)) {
    console.error("Error: Invalid root URL provided");
    process.exit(1);
  }

  return { rootUrl, maxDepth, maxWorkers };
}
