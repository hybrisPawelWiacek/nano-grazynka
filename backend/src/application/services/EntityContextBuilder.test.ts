import { EntityContextBuilder } from './EntityContextBuilder';
import type { IEntityRepository } from '../../domain/repositories/IEntityRepository';
import type { IProjectRepository } from '../../domain/repositories/IProjectRepository';
import type { Entity } from '../../domain/entities/Entity';

describe('EntityContextBuilder', () => {
  let builder: EntityContextBuilder;
  let mockEntityRepo: IEntityRepository;
  let mockProjectRepo: IProjectRepository;

  beforeEach(() => {
    // Create mock repositories
    mockEntityRepo = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByProject: jest.fn(),
      searchByName: jest.fn(),
      addToProject: jest.fn(),
      removeFromProject: jest.fn()
    };

    mockProjectRepo = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByName: jest.fn(),
      addVoiceNote: jest.fn(),
      removeVoiceNote: jest.fn()
    };

    builder = new EntityContextBuilder(mockEntityRepo, mockProjectRepo);
  });

  describe('buildContext', () => {
    it('should fetch entities by project when projectId is provided', async () => {
      const mockEntities: Entity[] = [
        {
          id: '1',
          userId: 'user1',
          name: 'Claude API',
          type: 'technical',
          value: 'Claude API',
          aliases: ['Claude SDK'],
          description: 'Anthropic API',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      (mockEntityRepo.findByProject as jest.Mock).mockResolvedValue(mockEntities);

      await builder.buildContext('user1', 'project1', 'gpt4o');

      expect(mockEntityRepo.findByProject).toHaveBeenCalledWith('project1');
      expect(mockEntityRepo.findByUserId).not.toHaveBeenCalled();
    });

    it('should fetch entities by userId when projectId is null', async () => {
      const mockEntities: Entity[] = [];
      (mockEntityRepo.findByUserId as jest.Mock).mockResolvedValue(mockEntities);

      await builder.buildContext('user1', null, 'gpt4o');

      expect(mockEntityRepo.findByUserId).toHaveBeenCalledWith('user1');
      expect(mockEntityRepo.findByProject).not.toHaveBeenCalled();
    });
  });

  describe('compressForGPT4o', () => {
    it('should compress entities to top 20 for GPT-4o', async () => {
      const mockEntities: Entity[] = [];
      
      // Create 30 entities of different types
      for (let i = 1; i <= 10; i++) {
        mockEntities.push({
          id: `tech-${i}`,
          userId: 'user1',
          name: `Technical${i}`,
          type: 'technical',
          value: `TechValue${i}`,
          aliases: [],
          description: undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      for (let i = 1; i <= 10; i++) {
        mockEntities.push({
          id: `person-${i}`,
          userId: 'user1',
          name: `Person${i}`,
          type: 'person',
          value: `PersonValue${i}`,
          aliases: [],
          description: undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      for (let i = 1; i <= 10; i++) {
        mockEntities.push({
          id: `company-${i}`,
          userId: 'user1',
          name: `Company${i}`,
          type: 'company',
          value: `CompanyValue${i}`,
          aliases: [],
          description: undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      (mockEntityRepo.findByUserId as jest.Mock).mockResolvedValue(mockEntities);

      const context = await builder.buildContext('user1', null, 'gpt4o');

      // Should have compressed field with exactly 20 entities
      expect(context.compressed).toBeDefined();
      const compressedEntities = context.compressed.split(', ');
      expect(compressedEntities.length).toBe(20);
      
      // Should prioritize technical terms first
      expect(compressedEntities[0]).toBe('TechValue1');
      expect(compressedEntities[9]).toBe('TechValue10');
      expect(compressedEntities[10]).toBe('PersonValue1');
      expect(compressedEntities[19]).toBe('PersonValue10');
    });

    it('should handle empty entity lists gracefully', async () => {
      (mockEntityRepo.findByUserId as jest.Mock).mockResolvedValue([]);

      const context = await builder.buildContext('user1', null, 'gpt4o');

      expect(context.compressed).toBe('');
      expect(context.people).toBe('');
      expect(context.technical).toBe('');
      expect(context.companies).toBe('');
      expect(context.products).toBe('');
    });
  });

  describe('expandForGemini', () => {
    it('should include descriptions for people in Gemini context', async () => {
      const mockEntities: Entity[] = [
        {
          id: '1',
          userId: 'user1',
          name: 'Dario',
          type: 'person',
          value: 'Dario Amodei',
          aliases: [],
          description: 'CEO of Anthropic',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          userId: 'user1',
          name: 'Claude',
          type: 'person',
          value: 'Claude Shannon',
          aliases: [],
          description: undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      (mockEntityRepo.findByUserId as jest.Mock).mockResolvedValue(mockEntities);

      const context = await builder.buildContext('user1', null, 'gemini');

      expect(context.people).toBe('Dario Amodei (CEO of Anthropic), Claude Shannon');
    });

    it('should build detailed context with all entity types', async () => {
      const mockEntities: Entity[] = [
        {
          id: '1',
          userId: 'user1',
          name: 'Dario',
          type: 'person',
          value: 'Dario Amodei',
          aliases: ['Dario'],
          description: 'CEO of Anthropic',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          userId: 'user1',
          name: 'Claude API',
          type: 'technical',
          value: 'Claude API',
          aliases: ['Claude SDK', 'Anthropic API'],
          description: 'API for Claude models',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          userId: 'user1',
          name: 'Anthropic',
          type: 'company',
          value: 'Anthropic',
          aliases: [],
          description: 'AI safety company',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '4',
          userId: 'user1',
          name: 'Claude',
          type: 'product',
          value: 'Claude',
          aliases: [],
          description: 'AI assistant',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      (mockEntityRepo.findByUserId as jest.Mock).mockResolvedValue(mockEntities);

      const context = await builder.buildContext('user1', null, 'gemini');

      expect(context.detailed).toBeDefined();
      expect(context.detailed).toContain('Team Members and People:');
      expect(context.detailed).toContain('Dario Amodei: CEO of Anthropic (also known as: Dario)');
      expect(context.detailed).toContain('Technical Terms and Concepts:');
      expect(context.detailed).toContain('Claude API: API for Claude models (alternatives: Claude SDK, Anthropic API)');
      expect(context.detailed).toContain('Companies and Organizations:');
      expect(context.detailed).toContain('Anthropic: AI safety company');
      expect(context.detailed).toContain('Products and Services:');
      expect(context.detailed).toContain('Claude: AI assistant');
    });
  });
});