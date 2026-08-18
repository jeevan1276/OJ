import {
  httpRequestDurationMs,
  totalRequests
} from '../utils/metrics.js';
import logger from '../utils/logger.js';

/**
 * Middleware to track HTTP request duration and update metrics
 */
export function requestMetricsMiddleware(req, res, next) {
  const startTime = Date.now();
  
  // Override the res.json method to capture when response is sent
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    const duration = Date.now() - startTime;
    const route = req.route?.path || req.path || 'unknown';
    const method = req.method;
    const statusCode = res.statusCode;

    // Record metrics
    httpRequestDurationMs.observe(
      { method, route, status_code: statusCode },
      duration
    );
    totalRequests.inc({
      method,
      route,
      status_code: statusCode
    });

    // Log the request
    logger.info('HTTP Request completed', {
      method,
      route,
      statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

    return originalJson(data);
  };

  // Also track non-JSON responses
  const originalSend = res.send.bind(res);
  res.send = function(data) {
    if (!res.json.called) {
      const duration = Date.now() - startTime;
      const route = req.route?.path || req.path || 'unknown';
      const method = req.method;
      const statusCode = res.statusCode;

      httpRequestDurationMs.observe(
        { method, route, status_code: statusCode },
        duration
      );
      totalRequests.inc({
        method,
        route,
        status_code: statusCode
      });

      logger.info('HTTP Request completed', {
        method,
        route,
        statusCode,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
    }

    return originalSend(data);
  };

  next();
}

export default requestMetricsMiddleware;
