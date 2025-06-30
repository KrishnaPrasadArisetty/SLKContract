import winston from "winston";

export const combinedLogFilePath = "combined.log";
export const errorLogFilePath = "error.log";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: errorLogFilePath, level: "error" }),
    new winston.transports.File({ filename: combinedLogFilePath }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}
