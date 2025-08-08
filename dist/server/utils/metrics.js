import pino from 'pino';
const logger = pino();
const counters = Object.create(null);
export function recordEvent(eventName, details) {
    counters[eventName] = (counters[eventName] || 0) + 1;
    logger.info({ type: 'metric', event: eventName, count: counters[eventName], ...(details || {}), ts: new Date().toISOString() });
}
export function getCounters() {
    return counters;
}
