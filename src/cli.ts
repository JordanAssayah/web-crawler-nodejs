import { isValidUrl } from "./utils/url.js";

export interface CLIArgs {
  rootUrl: string;
  maxDepth: number;
}

/**
 * Parse and validate command line arguments
 */
export function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    console.error("Usage: bun run index.ts <root_url> <max_depth>");
    console.error("Example: bun run index.ts http://www.example.com 2");
    process.exit(1);
  }

  const [rootUrl, maxDepthStr] = args;
  const maxDepth = parseInt(maxDepthStr, 10);

  // Validate arguments
  if (isNaN(maxDepth) || maxDepth < 0) {
    console.error("Error: max_depth must be a non-negative integer");
    process.exit(1);
  }

  if (!isValidUrl(rootUrl)) {
    console.error("Error: Invalid root URL provided");
    process.exit(1);
  }

  return { rootUrl, maxDepth };
}
