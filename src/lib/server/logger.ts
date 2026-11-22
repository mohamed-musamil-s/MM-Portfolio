import pino, { type Logger } from "pino";
import { env } from "./env";

/**
 * Centralized server-side logger. JSON lines in production (ready for any log
 * shipper), pretty-printed in development. Secrets are redacted at the source.
 */

const REDACT_PATHS = [
  "accessCode",
  "*.accessCode",
  "password",
  "*.password",
  "token",
  "*.token",
  "cookie",
  "*.cookie",
  "headers.cookie",
  "headers.authorization",
  "MONGODB_URI",
];

const createLogger = (): Logger => {
  const options: pino.LoggerOptions = {
    level: env.logLevel(),
    base: { app: "mm-portfolio" },
    redact: { paths: REDACT_PATHS, censor: "[REDACTED]" },
    timestamp: pino.stdTimeFunctions.isoTime,
    serializers: { err: pino.stdSerializers.err },
  };

  if (env.isProduction()) {
    return pino(options);
  }

  // Synchronous pretty stream: no worker thread, safe inside Next bundles.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pretty = require("pino-pretty") as typeof import("pino-pretty");
  return pino(options, pretty({ colorize: true, translateTime: "SYS:HH:MM:ss.l", ignore: "pid,hostname,app" }));
};

const globalForLogger = globalThis as unknown as { __mmLogger?: Logger };

export const logger: Logger = globalForLogger.__mmLogger ?? createLogger();
globalForLogger.__mmLogger = logger;

export type LogScope = "db" | "api" | "auth" | "proxy" | "server";

export const getLogger = (scope: LogScope): Logger => logger.child({ scope });
