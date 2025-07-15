import { config } from './config'

class ApiClient {
  private baseURL: string

  constructor() {
    this.baseURL = config.apiUrl
  }

  private async request(endpoint: string, options: any = {}): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`
    const config: any = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    return fetch(url, config)
  }

  async get(endpoint: string): Promise<Response> {
    return this.request(endpoint, { method: 'GET' })
  }

  async post(endpoint: string, data?: any): Promise<Response> {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put(endpoint: string, data?: any): Promise<Response> {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete(endpoint: string): Promise<Response> {
    return this.request(endpoint, { method: 'DELETE' })
  }
}

export const api = new ApiClient() 