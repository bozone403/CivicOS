// Thin wrapper around generated SDK to inject base URL and auth token
import { Api } from './generated-sdk';
import { config } from './config';

export function createCivicOsClient(token?: string) {
  return new Api({
    BASE: config.apiUrl.replace(/\/$/, ''),
    TOKEN: token || localStorage.getItem('civicos-jwt') || undefined,
  });
}

export type CivicOsClient = ReturnType<typeof createCivicOsClient>;


