import { describe, it, expect, spyOn, afterEach } from "bun:test";
import { parseArgs } from "../cli.js";
import { getCpuCoreCount } from "../utils/system.js";

describe("CLI Validation", () => {
  let exitSpy: ReturnType<typeof spyOn>;
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    exitSpy?.mockRestore();
    consoleSpy?.mockRestore();
  });

  describe("maxWorkers validation", () => {
    it("should accept maxWorkers within CPU core limit", () => {
      const cpuCores = getCpuCoreCount();
      const validWorkers = Math.min(2, cpuCores);

      // Mock process.argv
      const originalArgv = process.argv;
      process.argv = [
        "node",
        "script.js",
        "https://example.com",
        "2",
        validWorkers.toString(),
      ];

      const result = parseArgs();
      expect(result.maxWorkers).toBe(validWorkers);

      // Restore argv
      process.argv = originalArgv;
    });

    it("should reject maxWorkers exceeding CPU core limit", () => {
      exitSpy = spyOn(process, "exit").mockImplementation((code) => {
        throw new Error(`process.exit(${code})`);
      });
      consoleSpy = spyOn(console, "error").mockImplementation(() => {});

      const cpuCores = getCpuCoreCount();
      const excessiveWorkers = cpuCores + 5;

      // Mock process.argv
      const originalArgv = process.argv;
      process.argv = [
        "node",
        "script.js",
        "https://example.com",
        "2",
        excessiveWorkers.toString(),
      ];

      expect(() => parseArgs()).toThrow("process.exit(1)");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `Error: max_workers (${excessiveWorkers}) exceeds available CPU cores`
        )
      );

      // Restore argv
      process.argv = originalArgv;
    });

    it("should reject negative maxWorkers", () => {
      exitSpy = spyOn(process, "exit").mockImplementation((code) => {
        throw new Error(`process.exit(${code})`);
      });
      consoleSpy = spyOn(console, "error").mockImplementation(() => {});

      // Mock process.argv
      const originalArgv = process.argv;
      process.argv = ["node", "script.js", "https://example.com", "2", "-1"];

      expect(() => parseArgs()).toThrow("process.exit(1)");
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error: max_workers must be a positive integer"
      );

      // Restore argv
      process.argv = originalArgv;
    });

    it("should accept maxWorkers = 1", () => {
      // Mock process.argv
      const originalArgv = process.argv;
      process.argv = ["node", "script.js", "https://example.com", "2", "1"];

      const result = parseArgs();
      expect(result.maxWorkers).toBe(1);

      // Restore argv
      process.argv = originalArgv;
    });
  });
});
