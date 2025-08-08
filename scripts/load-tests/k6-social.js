import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 20,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<400'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://civicos.onrender.com';
const TOKEN = __ENV.TOKEN || '';

export default function () {
  const headers = TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};
  const res1 = http.get(`${BASE_URL}/api/social/feed?limit=10&offset=0`, { headers });
  check(res1, { 'feed 200': (r) => r.status === 200 });
  sleep(0.3);
  const res2 = http.get(`${BASE_URL}/api/notifications`, { headers });
  check(res2, { 'notifications 200': (r) => r.status === 200 || r.status === 401 });
  sleep(0.3);
  const res3 = http.get(`${BASE_URL}/api/social/conversations`, { headers });
  check(res3, { 'messages 200': (r) => r.status === 200 || r.status === 401 });
  sleep(0.4);
}


