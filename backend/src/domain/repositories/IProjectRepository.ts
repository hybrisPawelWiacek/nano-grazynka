import { Project, CreateProjectDTO, UpdateProjectDTO } from '../models/Project';

export interface IProjectRepository {
  create(project: CreateProjectDTO): Promise<Project>;
  update(id: string, updates: UpdateProjectDTO): Promise<Project>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Project | null>;
  findByUserId(userId: string): Promise<Project[]>;
  findByName(userId: string, name: string): Promise<Project | null>;
  addVoiceNote(projectId: string, voiceNoteId: string): Promise<void>;
  removeVoiceNote(projectId: string, voiceNoteId: string): Promise<void>;
}