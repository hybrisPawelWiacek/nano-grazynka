export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectDTO {
  userId: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface ProjectWithRelations extends Project {
  entities?: any[];
  voiceNotes?: any[];
}