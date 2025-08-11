// Base HTTP client with error handling

import { config } from '../config';
import type { ApiError } from '../types';

export class ApiClient {
  public baseUrl: string;
  private timeout: number;

  constructor(baseUrl?: string, timeout?: number) {
    this.baseUrl = baseUrl || config.api.baseUrl;
    this.timeout = timeout || config.api.timeout;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let error: ApiError;
      try {
        error = await response.json();
      } catch {
        error = {
          statusCode: response.status,
          error: response.statusText,
          message: `Request failed with status ${response.status}`,
        };
      }
      throw error;
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
    }

    return response.json();
  }

  private createAbortController(): { controller: AbortController; timeoutId: NodeJS.Timeout } {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    return { controller, timeoutId };
  }

  async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    
    // Add query parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const { controller, timeoutId } = this.createAbortController();

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      return await this.handleResponse<T>(response);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw {
          statusCode: 408,
          error: 'Request Timeout',
          message: 'The request took too long to complete',
        } as ApiError;
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async post<T>(path: string, body?: any): Promise<T> {
    const { controller, timeoutId } = this.createAbortController();

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      return await this.handleResponse<T>(response);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw {
          statusCode: 408,
          error: 'Request Timeout',
          message: 'The request took too long to complete',
        } as ApiError;
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async postFormData<T>(path: string, formData: FormData): Promise<T> {
    const { controller, timeoutId } = this.createAbortController();

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        // Don't set Content-Type header - browser will set it with boundary
      });

      return await this.handleResponse<T>(response);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw {
          statusCode: 408,
          error: 'Request Timeout',
          message: 'The request took too long to complete',
        } as ApiError;
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async put<T>(path: string, body?: any): Promise<T> {
    const { controller, timeoutId } = this.createAbortController();

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      return await this.handleResponse<T>(response);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw {
          statusCode: 408,
          error: 'Request Timeout',
          message: 'The request took too long to complete',
        } as ApiError;
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async delete<T>(path: string): Promise<T> {
    const { controller, timeoutId } = this.createAbortController();

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      return await this.handleResponse<T>(response);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw {
          statusCode: 408,
          error: 'Request Timeout',
          message: 'The request took too long to complete',
        } as ApiError;
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();