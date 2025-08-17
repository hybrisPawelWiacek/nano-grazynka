// Project API client methods

import type { Entity } from './entities';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101';

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  entityCount?: number;
  noteCount?: number;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface ListProjectsResponse {
  projects: Project[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ProjectEntitiesResponse {
  entities: Entity[];
  projectId: string;
  total: number;
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

export const projectsApi = {
  // Create a new project
  async createProject(project: CreateProjectDto): Promise<Project> {
    const response = await fetch(`${API_URL}/api/projects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(project),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create project');
    }

    const data = await response.json();
    return data.project;
  },

  // List all projects for the current user
  async listProjects(page?: number, limit?: number): Promise<ListProjectsResponse> {
    const queryParams = new URLSearchParams();
    
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());
    
    const url = `${API_URL}/api/projects${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to list projects');
    }

    return response.json();
  },

  // Get project by ID
  async getProject(id: string): Promise<Project> {
    const response = await fetch(`${API_URL}/api/projects/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get project');
    }

    const data = await response.json();
    return data.project;
  },

  // Update a project
  async updateProject(id: string, updates: UpdateProjectDto): Promise<Project> {
    const response = await fetch(`${API_URL}/api/projects/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update project');
    }

    const data = await response.json();
    return data.project;
  },

  // Delete a project
  async deleteProject(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/projects/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete project');
    }
  },

  // Add entities to a project (expects array)
  async addEntitiesToProject(projectId: string, entityIds: string[]): Promise<void> {
    const response = await fetch(`${API_URL}/api/projects/${projectId}/entities`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ entityIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add entities to project');
    }
  },

  // Remove entities from a project (expects array)
  async removeEntitiesFromProject(projectId: string, entityIds: string[]): Promise<void> {
    const response = await fetch(`${API_URL}/api/projects/${projectId}/entities`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ entityIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove entities from project');
    }
  },

  // Legacy single entity methods (kept for backward compatibility but use array internally)
  async addEntityToProject(projectId: string, entityId: string): Promise<void> {
    return this.addEntitiesToProject(projectId, [entityId]);
  },

  async removeEntityFromProject(projectId: string, entityId: string): Promise<void> {
    return this.removeEntitiesFromProject(projectId, [entityId]);
  },

  // Get all entities in a project
  async getProjectEntities(projectId: string): Promise<ProjectEntitiesResponse> {
    const response = await fetch(`${API_URL}/api/projects/${projectId}/entities`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get project entities');
    }

    return response.json();
  },

  // Activate a project (set as current)
  async activateProject(id: string): Promise<Project> {
    return this.updateProject(id, { isActive: true });
  },

  // Deactivate a project
  async deactivateProject(id: string): Promise<Project> {
    return this.updateProject(id, { isActive: false });
  },
};;