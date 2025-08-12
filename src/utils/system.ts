import { cpus } from "os";

/**
 * Get the number of CPU cores available on the system
 */
export function getCpuCoreCount(): number {
  return cpus().length;
}

/**
 * Calculate optimal number of workers based on CPU cores
 * @param maxWorkers Optional maximum number of workers to use
 * @returns Optimal number of workers
 */
export function getOptimalWorkerCount(maxWorkers?: number): number {
  const cpuCores = getCpuCoreCount();
  console.log(`System has ${cpuCores} CPU cores available`);

  // Use all cores minus 1 to keep one core free for the main process
  // or use the specified maxWorkers if provided
  const optimalWorkers = Math.min(
    maxWorkers || Math.max(1, cpuCores - 1),
    cpuCores
  );

  console.log(`Using ${optimalWorkers} worker threads for parallel processing`);
  return optimalWorkers;
}
