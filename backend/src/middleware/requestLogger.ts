import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? '⚠️' : '✅';

    console.log(`${logLevel} [${req.method}] ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
};

export default requestLogger;
