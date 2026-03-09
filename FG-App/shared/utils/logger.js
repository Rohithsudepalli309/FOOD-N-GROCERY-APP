const winston = require('winston');

// Custom format
const customFormat = winston.format.printf(({ level, message, timestamp, service, ...meta }) => {
  return JSON.stringify({
    timestamp,
    level,
    service: service || 'unknown-service',
    message,
    ...meta
  });
});

/**
 * Creates a configured winston logger instance for a specific microservice.
 * @param {string} serviceName - Name of the calling service (e.g., 'order-service')
 */
const createLogger = (serviceName) => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service: serviceName },
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      customFormat
    ),
    transports: [
      new winston.transports.Console()
      // Note: In production, you would add File or CloudWatch transports here
    ]
  });
};

module.exports = { createLogger };
