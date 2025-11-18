import winston from 'winston';

const enumerateErrorFormat = winston.format(info => {
  if (info instanceof Error) {
    Object.assign(info, { message: info.message, stack: info.stack });
  }
  return info;
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    enumerateErrorFormat(),
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
      const base = `${timestamp} [${level.toUpperCase()}]: ${message}`;
      const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return stack ? `${base}\n${stack}` : `${base}${metaString}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

logger.stream = {
  write: message => {
    logger.info(message.trim());
  }
};

export default logger;

