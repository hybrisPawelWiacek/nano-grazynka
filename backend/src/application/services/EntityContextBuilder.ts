import { IEntityRepository } from '../../domain/repositories/IEntityRepository';
import { IProjectRepository } from '../../domain/repositories/IProjectRepository';
import { Entity, EntityContext, GroupedEntities } from '../../domain/models/Entity';

export type ModelType = 'gpt4o' | 'gemini';

export class EntityContextBuilder {
  constructor(
    private entityRepo: IEntityRepository,
    private projectRepo: IProjectRepository
  ) {}

  async buildContext(
    userId: string,
    projectId: string | null,
    modelType: ModelType
  ): Promise<EntityContext> {
    // Get entities for project or user
    const entities = projectId 
      ? await this.entityRepo.findByProject(projectId)
      : await this.entityRepo.findByUserId(userId);

    // Group by type
    const grouped = this.groupByType(entities);

    // Optimize for model
    if (modelType === 'gpt4o') {
      return this.compressForGPT4o(grouped);
    } else {
      return this.expandForGemini(grouped);
    }
  }

  private groupByType(entities: Entity[]): GroupedEntities {
    const grouped: GroupedEntities = {};
    
    for (const entity of entities) {
      const type = entity.type;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(entity);
    }
    
    return grouped;
  }

  private compressForGPT4o(grouped: GroupedEntities): EntityContext {
    // For GPT-4o, we need to be token-efficient
    // Simple compression: top 20 entities as comma-separated list
    const allEntities: Entity[] = [];
    
    // Prioritize by type: technical > person > company > product
    if (grouped.technical) allEntities.push(...grouped.technical);
    if (grouped.person) allEntities.push(...grouped.person);
    if (grouped.company) allEntities.push(...grouped.company);
    if (grouped.product) allEntities.push(...grouped.product);
    
    // Take top 20 entities
    const top20 = allEntities.slice(0, 20);
    
    return {
      compressed: top20.map(e => e.value).join(', '),
      // Individual type lists for selective use
      people: grouped.person?.slice(0, 5).map(e => e.value).join(', ') || '',
      technical: grouped.technical?.slice(0, 5).map(e => e.value).join(', ') || '',
      companies: grouped.company?.slice(0, 5).map(e => e.value).join(', ') || '',
      products: grouped.product?.slice(0, 5).map(e => e.value).join(', ') || ''
    };
  }

  private expandForGemini(grouped: GroupedEntities): EntityContext {
    // For Gemini with 1M tokens, we can be more verbose
    return {
      compressed: '', // Not used for Gemini
      people: grouped.person?.map(e => 
        e.description ? `${e.value} (${e.description})` : e.value
      ).join(', ') || '',
      technical: grouped.technical?.map(e => {
        if (e.aliases && e.aliases.length > 0) {
          return `${e.value} (aka: ${e.aliases.join(', ')})`;
        }
        return e.value;
      }).join(', ') || '',
      companies: grouped.company?.map(e => e.value).join(', ') || '',
      products: grouped.product?.map(e => e.value).join(', ') || '',
      detailed: this.buildDetailedContext(grouped)
    };
  }

  private buildDetailedContext(grouped: GroupedEntities): string {
    let context = '';
    
    if (grouped.person && grouped.person.length > 0) {
      context += `Team Members and People:\n`;
      grouped.person.forEach(e => {
        context += `- ${e.value}`;
        if (e.description) context += `: ${e.description}`;
        if (e.aliases && e.aliases.length > 0) {
          context += ` (also known as: ${e.aliases.join(', ')})`;
        }
        context += '\n';
      });
      context += '\n';
    }
    
    if (grouped.technical && grouped.technical.length > 0) {
      context += `Technical Terms and Concepts:\n`;
      grouped.technical.forEach(e => {
        context += `- ${e.value}`;
        if (e.description) context += `: ${e.description}`;
        if (e.aliases && e.aliases.length > 0) {
          context += ` (alternatives: ${e.aliases.join(', ')})`;
        }
        context += '\n';
      });
      context += '\n';
    }
    
    if (grouped.company && grouped.company.length > 0) {
      context += `Companies and Organizations:\n`;
      grouped.company.forEach(e => {
        context += `- ${e.value}`;
        if (e.description) context += `: ${e.description}`;
        context += '\n';
      });
      context += '\n';
    }
    
    if (grouped.product && grouped.product.length > 0) {
      context += `Products and Services:\n`;
      grouped.product.forEach(e => {
        context += `- ${e.value}`;
        if (e.description) context += `: ${e.description}`;
        context += '\n';
      });
      context += '\n';
    }
    
    return context.trim();
  }
}