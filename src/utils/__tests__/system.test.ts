import { describe, it, expect } from "bun:test";
import { getCpuCoreCount, getOptimalWorkerCount } from "../system.js";

describe("System Utils", () => {
  describe("getCpuCoreCount", () => {
    it("should return a positive number", () => {
      const coreCount = getCpuCoreCount();
      expect(coreCount).toBeGreaterThan(0);
      expect(Number.isInteger(coreCount)).toBe(true);
    });
  });

  describe("getOptimalWorkerCount", () => {
    it("should return a reasonable number of workers", () => {
      const workerCount = getOptimalWorkerCount();
      const coreCount = getCpuCoreCount();

      expect(workerCount).toBeGreaterThan(0);
      expect(workerCount).toBeLessThanOrEqual(coreCount);
      expect(Number.isInteger(workerCount)).toBe(true);
    });

    it("should respect maxWorkers parameter", () => {
      const maxWorkers = 2;
      const workerCount = getOptimalWorkerCount(maxWorkers);

      expect(workerCount).toBeLessThanOrEqual(maxWorkers);
      expect(workerCount).toBeGreaterThan(0);
    });

    it("should not exceed CPU core count", () => {
      const coreCount = getCpuCoreCount();
      const workerCount = getOptimalWorkerCount(coreCount + 5);

      expect(workerCount).toBeLessThanOrEqual(coreCount);
    });
  });
});
