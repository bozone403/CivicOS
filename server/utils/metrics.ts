import pino from 'pino';

const logger = pino();

type MetricCounters = Record<string, number>;

const counters: MetricCounters = Object.create(null);

export function recordEvent(eventName: string, details?: Record<string, unknown>) {
  counters[eventName] = (counters[eventName] || 0) + 1;
  logger.info({ type: 'metric', event: eventName, count: counters[eventName], ...(details || {}), ts: new Date().toISOString() });
}

export function getCounters(): Readonly<MetricCounters> {
  return counters;
}


