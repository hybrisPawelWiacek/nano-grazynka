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

    // Handle 204 No Content responses
    if (response.status === 204) {
      return {} as T;
    }

    // Handle empty responses or non-JSON content types
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
    }

    // Handle empty body even with JSON content type
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    try {
      return JSON.parse(text);
    } catch {
      return {} as T;
    }
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
      // Get session ID for anonymous users
      let sessionId: string | undefined;
      if (typeof window !== 'undefined') {
        sessionId = localStorage.getItem('anonymousSessionId') || undefined;
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add session ID header if available
      if (sessionId) {
        headers['x-session-id'] = sessionId;
      }
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        credentials: 'include', // Send cookies for authentication
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

  // New method that returns both promise and abort function
  getWithAbort<T>(path: string, params?: Record<string, any>): { promise: Promise<T>; abort: () => void } {
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
    
    const promise = (async () => {
      try {
        // Get session ID for anonymous users
        let sessionId: string | undefined;
        if (typeof window !== 'undefined') {
          sessionId = localStorage.getItem('anonymousSessionId') || undefined;
        }
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        // Add session ID header if available
        if (sessionId) {
          headers['x-session-id'] = sessionId;
        }
        
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers,
          credentials: 'include', // Send cookies for authentication
          signal: controller.signal,
        });

        return await this.handleResponse<T>(response);
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw {
            statusCode: 0,
            error: 'Request Cancelled',
            message: 'The request was cancelled',
            cancelled: true,
          } as ApiError;
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    })();

    const abort = () => {
      clearTimeout(timeoutId);
      controller.abort();
    };

    return { promise, abort };
  }

  async post<T>(path: string, body?: any): Promise<T> {
    const { controller, timeoutId } = this.createAbortController();

    try {
      // Get session ID for anonymous users
      let sessionId: string | undefined;
      if (typeof window !== 'undefined') {
        sessionId = localStorage.getItem('anonymousSessionId') || undefined;
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add session ID header if available
      if (sessionId) {
        headers['x-session-id'] = sessionId;
      }
      
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include', // Send cookies for authentication
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
      // Get session ID for anonymous users
      let sessionId: string | undefined;
      if (typeof window !== 'undefined') {
        sessionId = localStorage.getItem('anonymousSessionId') || undefined;
      }
      
      const headers: Record<string, string> = {};
      
      // Add session ID header if available
      if (sessionId) {
        headers['x-session-id'] = sessionId;
      }
      
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        body: formData,
        credentials: 'include', // Send cookies for authentication
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
      // Get session ID for anonymous users
      let sessionId: string | undefined;
      if (typeof window !== 'undefined') {
        sessionId = localStorage.getItem('anonymousSessionId') || undefined;
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add session ID header if available
      if (sessionId) {
        headers['x-session-id'] = sessionId;
      }
      
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'PUT',
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include', // Send cookies for authentication
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
      // Get session ID for anonymous users
      let sessionId: string | undefined;
      if (typeof window !== 'undefined') {
        sessionId = localStorage.getItem('anonymousSessionId') || undefined;
      }
      
      const headers: Record<string, string> = {};
      
      // Add session ID header if available
      if (sessionId) {
        headers['x-session-id'] = sessionId;
      }
      
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'DELETE',
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        credentials: 'include', // Send cookies for authentication
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