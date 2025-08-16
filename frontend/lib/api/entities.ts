// Entity API client methods

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101';

export type EntityType = 'person' | 'company' | 'technical' | 'product';

export interface Entity {
  id: string;
  userId: string;
  name: string;
  type: EntityType;
  value: string;
  aliases?: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntityDto {
  name: string;
  type: EntityType;
  value: string;
  aliases?: string[];
  description?: string;
}

export interface UpdateEntityDto {
  name?: string;
  type?: EntityType;
  value?: string;
  aliases?: string[];
  description?: string;
}

export interface ListEntitiesParams {
  projectId?: string;
  search?: string;
  type?: EntityType;
  page?: number;
  limit?: number;
}

export interface ListEntitiesResponse {
  entities: Entity[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  const sessionId = localStorage.getItem('anonymousSessionId');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (sessionId) {
    headers['x-session-id'] = sessionId;
  }
  
  return headers;
};

export const entitiesApi = {
  // Create a new entity
  async createEntity(entity: CreateEntityDto): Promise<Entity> {
    const response = await fetch(`${API_URL}/api/entities`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(entity),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create entity');
    }

    const data = await response.json();
    return data.entity;
  },

  // List entities with optional filters
  async listEntities(params?: ListEntitiesParams): Promise<ListEntitiesResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.projectId) queryParams.append('projectId', params.projectId);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `${API_URL}/api/entities${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to list entities');
    }

    return response.json();
  },

  // Get entity by ID
  async getEntity(id: string): Promise<Entity> {
    const response = await fetch(`${API_URL}/api/entities/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get entity');
    }

    const data = await response.json();
    return data.entity;
  },

  // Update an entity
  async updateEntity(id: string, updates: UpdateEntityDto): Promise<Entity> {
    const response = await fetch(`${API_URL}/api/entities/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update entity');
    }

    const data = await response.json();
    return data.entity;
  },

  // Delete an entity
  async deleteEntity(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/entities/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete entity');
    }
  },

  // Batch create entities
  async batchCreateEntities(entities: CreateEntityDto[]): Promise<Entity[]> {
    const promises = entities.map(entity => this.createEntity(entity));
    return Promise.all(promises);
  },
};