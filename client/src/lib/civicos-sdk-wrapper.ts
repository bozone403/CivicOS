// Thin wrapper around generated SDK to inject base URL and auth token
import { OpenAPI } from './generated-sdk';
import { request as __request } from './generated-sdk/core/request';
import { config } from './config';

export function createCivicOsClient(token?: string) {
  OpenAPI.BASE = config.apiUrl.replace(/\/$/, '');
  OpenAPI.TOKEN = token || localStorage.getItem('civicos-jwt') || undefined;
  return {
    request: (opts: any) => __request(OpenAPI, opts),
  };
}

export type CivicOsClient = ReturnType<typeof createCivicOsClient>;


