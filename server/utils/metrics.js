import client from 'prom-client';

// Create a registry for storing metrics
const register = new client.Registry();

// Default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom histogram for tracking HTTP request duration (in milliseconds)
const httpRequestDurationMs = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in milliseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000, 10000],
  registers: [register]
});

// Custom histogram for tracking code execution latency (compilation + runtime)
const codeExecutionDurationMs = new client.Histogram({
  name: 'code_execution_duration_ms',
  help: 'Duration of code execution (compilation + runtime) in milliseconds',
  labelNames: ['language', 'status'],
  buckets: [100, 500, 1000, 2000, 5000, 10000, 15000, 30000],
  registers: [register]
});

// Counter for tracking total requests
const totalRequests = new client.Counter({
  name: 'total_http_requests',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Counter for tracking total submissions
const totalSubmissions = new client.Counter({
  name: 'total_submissions',
  help: 'Total number of code submissions',
  labelNames: ['language', 'status'],
  registers: [register]
});

// Gauge for tracking active code executions
const activeCodeExecutions = new client.Gauge({
  name: 'active_code_executions',
  help: 'Number of active code executions',
  registers: [register]
});

/**
 * Function to calculate percentile from histogram
 * Note: prom-client histograms provide buckets and counts, not raw values
 * For accurate p95 calculation, we compute based on bucket distribution
 */
function calculatePercentile(histogram, percentile) {
  const data = histogram.get();
  if (!data || !data.values || data.values.length === 0) {
    return 0;
  }

  // Extract bucket information
  const buckets = data.values.filter(v => v.metricName.endsWith('_bucket'));
  if (buckets.length === 0) return 0;

  const totalCount = buckets[buckets.length - 1].value; // The +Inf bucket
  if (totalCount === 0) return 0;

  const targetCount = (totalCount * percentile) / 100;
  let cumulativeCount = 0;

  for (const bucket of buckets) {
    cumulativeCount += bucket.value;
    if (cumulativeCount >= targetCount) {
      // Extract the le (less than or equal) value from the bucket label
      const leValue = parseFloat(bucket.labels.le);
      return leValue;
    }
  }

  return 0;
}

/**
 * Get p95 latency for HTTP requests
 */
function getHttpP95Latency() {
  return calculatePercentile(httpRequestDurationMs, 95);
}

/**
 * Get p95 latency for code execution
 */
function getCodeExecutionP95Latency() {
  return calculatePercentile(codeExecutionDurationMs, 95);
}

/**
 * Get all metrics in Prometheus format
 */
async function getMetrics() {
  return register.metrics();
}

export {
  register,
  httpRequestDurationMs,
  codeExecutionDurationMs,
  totalRequests,
  totalSubmissions,
  activeCodeExecutions,
  getHttpP95Latency,
  getCodeExecutionP95Latency,
  getMetrics
};
