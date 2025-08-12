/**
 * Enterprise-grade logging configuration using Pino
 * Provides structured logging with appropriate levels for different environments
 */

import pino from "pino";

// Configure log level based on environment
const getLogLevel = (): string => {
  if (process.env.NODE_ENV === "test") {
    return "warn"; // Only show warnings and errors in tests
  }
  if (process.env.NODE_ENV === "production") {
    return "info"; // Production logging
  }
  return "debug"; // Development - show everything
};

// Create the logger instance
export const logger = pino({
  level: getLogLevel(),
  // Add useful context to all logs
  base: {
    service: "web-crawler",
    version: "1.0.0",
  },
});

// Export specialized loggers for different components
export const httpLogger = logger.child({ component: "http" });
export const crawlerLogger = logger.child({ component: "crawler" });
export const htmlLogger = logger.child({ component: "html" });
export const systemLogger = logger.child({ component: "system" });
export const parallelCrawlerLogger = logger.child({
  component: "parallel-crawler",
});
export const workerLogger = logger.child({ component: "worker" });

export default logger;
