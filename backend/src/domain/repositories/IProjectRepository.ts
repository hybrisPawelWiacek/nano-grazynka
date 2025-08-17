import { Project, CreateProjectDTO, UpdateProjectDTO } from '../entities/Project';

export interface IProjectRepository {
  create(project: CreateProjectDTO): Promise<Project>;
  update(id: string, updates: UpdateProjectDTO): Promise<Project>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Project | null>;
  findByUserId(userId: string): Promise<Project[]>;
  findByName(userId: string, name: string): Promise<Project | null>;
  addEntity(projectId: string, entityId: string): Promise<void>;
  removeEntity(projectId: string, entityId: string): Promise<void>;
  addVoiceNote(projectId: string, voiceNoteId: string): Promise<void>;
  removeVoiceNote(projectId: string, voiceNoteId: string): Promise<void>;
}