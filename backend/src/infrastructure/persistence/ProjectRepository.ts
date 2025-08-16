import { Project, CreateProjectDTO, UpdateProjectDTO } from '../../domain/models/Project';
import { IProjectRepository } from '../../domain/repositories/IProjectRepository';
import { PrismaClient } from '@prisma/client';

export class ProjectRepository implements IProjectRepository {
  constructor(
    private db: PrismaClient
  ) {}

  async create(dto: CreateProjectDTO): Promise<Project> {
    const result = await this.db.project.create({
      data: {
        userId: dto.userId,
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive !== undefined ? dto.isActive : true
      }
    });
    return this.mapToProject(result);
  }

  async update(id: string, updates: UpdateProjectDTO): Promise<Project> {
    const result = await this.db.project.update({
      where: { id },
      data: {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.isActive !== undefined && { isActive: updates.isActive })
      }
    });
    return this.mapToProject(result);
  }

  async delete(id: string): Promise<void> {
    await this.db.project.delete({
      where: { id }
    });
  }

  async findById(id: string): Promise<Project | null> {
    const result = await this.db.project.findUnique({
      where: { id }
    });
    return result ? this.mapToProject(result) : null;
  }

  async findByUserId(userId: string): Promise<Project[]> {
    const results = await this.db.project.findMany({
      where: { userId },
      orderBy: { name: 'asc' }
    });
    return results.map(r => this.mapToProject(r));
  }

  async findByName(userId: string, name: string): Promise<Project | null> {
    const result = await this.db.project.findFirst({
      where: { 
        userId,
        name 
      }
    });
    return result ? this.mapToProject(result) : null;
  }

  async addVoiceNote(projectId: string, voiceNoteId: string): Promise<void> {
    await this.db.projectNote.create({
      data: {
        projectId,
        voiceNoteId
      }
    });
  }

  async removeVoiceNote(projectId: string, voiceNoteId: string): Promise<void> {
    await this.db.projectNote.delete({
      where: {
        projectId_voiceNoteId: {
          projectId,
          voiceNoteId
        }
      }
    });
  }

  private mapToProject(dbProject: any): Project {
    return {
      id: dbProject.id,
      userId: dbProject.userId,
      name: dbProject.name,
      description: dbProject.description || undefined,
      isActive: dbProject.isActive,
      createdAt: dbProject.createdAt,
      updatedAt: dbProject.updatedAt
    };
  }
}