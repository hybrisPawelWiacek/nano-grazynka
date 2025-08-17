import { PrismaClient } from '@prisma/client';
import { ConfigLoader, Config } from '../../config/loader';
import { CompositeObservabilityProvider } from '../../infrastructure/observability/CompositeObservabilityProvider';
import { LangSmithObservabilityProvider } from '../../infrastructure/observability/LangSmithObservabilityProvider';
import { OpenLLMetryObservabilityProvider } from '../../infrastructure/observability/OpenLLMetryObservabilityProvider';
import { VoiceNoteRepositoryImpl } from '../../infrastructure/persistence/VoiceNoteRepositoryImpl';
import { UserRepositoryImpl } from '../../infrastructure/persistence/UserRepositoryImpl';
import { EventStoreImpl } from '../../infrastructure/persistence/EventStoreImpl';
import { WhisperAdapter } from '../../infrastructure/adapters/WhisperAdapter';
import { LLMAdapter } from '../../infrastructure/adapters/LLMAdapter';
import { LocalStorageAdapter } from '../../infrastructure/adapters/LocalStorageAdapter';
import { TitleGenerationAdapter } from '../../infrastructure/adapters/TitleGenerationAdapter';
import { AudioMetadataExtractor } from '../../infrastructure/adapters/AudioMetadataExtractor';
import { DatabaseClient } from '../../infrastructure/database/DatabaseClient';
import { ProcessingOrchestrator } from '../../application/services/ProcessingOrchestrator';
import {
  UploadVoiceNoteUseCase,
  ProcessVoiceNoteUseCase,
  GetVoiceNoteUseCase,
  ListVoiceNotesUseCase,
  DeleteVoiceNoteUseCase,
  ReprocessVoiceNoteUseCase,
  ExportVoiceNoteUseCase,
  MigrateAnonymousToUserUseCase
} from '../../application/use-cases';

// Entity use cases
import { CreateEntityUseCase } from '../../application/use-cases/entities/CreateEntityUseCase';
import { UpdateEntityUseCase } from '../../application/use-cases/entities/UpdateEntityUseCase';
import { DeleteEntityUseCase } from '../../application/use-cases/entities/DeleteEntityUseCase';
import { ListEntitiesUseCase } from '../../application/use-cases/entities/ListEntitiesUseCase';

// Project use cases
import { CreateProjectUseCase } from '../../application/use-cases/projects/CreateProjectUseCase';
import { UpdateProjectUseCase } from '../../application/use-cases/projects/UpdateProjectUseCase';
import { DeleteProjectUseCase } from '../../application/use-cases/projects/DeleteProjectUseCase';
import { ListProjectsUseCase } from '../../application/use-cases/projects/ListProjectsUseCase';
import { ManageProjectEntitiesUseCase } from '../../application/use-cases/projects/ManageProjectEntitiesUseCase';

import { PromptLoader } from '../../infrastructure/config/PromptLoader';
import { EntityRepository } from '../../infrastructure/persistence/EntityRepository';
import { ProjectRepository } from '../../infrastructure/persistence/ProjectRepository';
import { EntityUsageRepository } from '../../infrastructure/persistence/EntityUsageRepository';
import { EntityContextBuilder } from '../../application/services/EntityContextBuilder';
import { IEntityRepository } from '../../domain/repositories/IEntityRepository';
import { IProjectRepository } from '../../domain/repositories/IProjectRepository';
import { IEntityUsageRepository } from '../../domain/repositories/IEntityUsageRepository';

export class Container {
  private static instance: Container;
  private config: Config;
  private prisma: PrismaClient;
  private observability: CompositeObservabilityProvider;
  private promptLoader: PromptLoader;
  
  private voiceNoteRepository: VoiceNoteRepositoryImpl;
  private userRepository: UserRepositoryImpl;
  private eventStore: EventStoreImpl;
  private entityRepository: IEntityRepository;
  private projectRepository: IProjectRepository;
  private entityUsageRepository: IEntityUsageRepository;
  private entityContextBuilder: EntityContextBuilder;
  private transcriptionService: WhisperAdapter;
  private summarizationService: LLMAdapter;
  private titleGenerationService: TitleGenerationAdapter;
  private storageService: LocalStorageAdapter;
  private audioMetadataExtractor: AudioMetadataExtractor;
  private processingOrchestrator: ProcessingOrchestrator;
  
  private constructor() {
    this.config = ConfigLoader.load();
    
    this.prisma = DatabaseClient.getInstance();
    
    // Initialize PromptLoader as singleton
    this.promptLoader = PromptLoader.getInstance();
    
    this.observability = new CompositeObservabilityProvider([
      new LangSmithObservabilityProvider(this.config),
      new OpenLLMetryObservabilityProvider(this.config)
    ]);
    
    this.voiceNoteRepository = new VoiceNoteRepositoryImpl(this.prisma);
    this.userRepository = new UserRepositoryImpl(this.prisma);
    this.eventStore = new EventStoreImpl(this.prisma);
    
    // Initialize Entity and Project repositories
    this.entityRepository = new EntityRepository(this.prisma);
    this.projectRepository = new ProjectRepository(this.prisma);
    this.entityUsageRepository = new EntityUsageRepository(this.prisma);
    
    // Initialize EntityContextBuilder
    this.entityContextBuilder = new EntityContextBuilder(
      this.entityRepository,
      this.projectRepository
    );
    
    // Pass PromptLoader to adapters
    this.transcriptionService = new WhisperAdapter(this.promptLoader);
    this.summarizationService = new LLMAdapter(this.promptLoader);
    this.titleGenerationService = new TitleGenerationAdapter(this.config, this.promptLoader);
    this.storageService = new LocalStorageAdapter();
    this.audioMetadataExtractor = new AudioMetadataExtractor();
    
    this.processingOrchestrator = new ProcessingOrchestrator(
      this.transcriptionService,
      this.summarizationService,
      this.titleGenerationService,
      this.voiceNoteRepository,
      this.eventStore,
      this.config,  // Pass the ConfigLoader instance
      this.entityContextBuilder,
      this.projectRepository,
      this.entityUsageRepository,
      this.entityRepository
    );
  }
  
  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }
  
  getConfig(): Config {
    return this.config;
  }
  
  getPromptLoader(): PromptLoader {
    return this.promptLoader;
  }
  
  getPrisma(): PrismaClient {
    if (!this.prisma) {
      console.error('Container.getPrisma(): prisma is undefined!');
      throw new Error('PrismaClient not initialized in Container');
    }
    return this.prisma;
  }
  
  getObservability(): CompositeObservabilityProvider {
    return this.observability;
  }
  
  getUserRepository(): UserRepositoryImpl {
    return this.userRepository;
  }
  
  getEntityRepository(): IEntityRepository {
    return this.entityRepository;
  }
  
  getProjectRepository(): IProjectRepository {
    return this.projectRepository;
  }
  
  getEntityContextBuilder(): EntityContextBuilder {
    return this.entityContextBuilder;
  }
  
  getEntityUsageRepository(): IEntityUsageRepository {
    return this.entityUsageRepository;
  }
  
  getUploadVoiceNoteUseCase(): UploadVoiceNoteUseCase {
    return new UploadVoiceNoteUseCase(
      this.voiceNoteRepository,
      this.storageService,
      this.eventStore,
      this.config,  // Pass the ConfigLoader instance
      this.audioMetadataExtractor
    );
  }
  
  getProcessVoiceNoteUseCase(): ProcessVoiceNoteUseCase {
    return new ProcessVoiceNoteUseCase(
      this.voiceNoteRepository,
      this.processingOrchestrator,
      this.eventStore
    );
  }
  
  getGetVoiceNoteUseCase(): GetVoiceNoteUseCase {
    return new GetVoiceNoteUseCase(this.voiceNoteRepository);
  }
  
  getListVoiceNotesUseCase(): ListVoiceNotesUseCase {
    return new ListVoiceNotesUseCase(this.voiceNoteRepository);
  }
  
  getDeleteVoiceNoteUseCase(): DeleteVoiceNoteUseCase {
    return new DeleteVoiceNoteUseCase(
      this.voiceNoteRepository,
      this.storageService,
      this.eventStore
    );
  }
  
  getReprocessVoiceNoteUseCase(): ReprocessVoiceNoteUseCase {
    return new ReprocessVoiceNoteUseCase(
      this.voiceNoteRepository,
      this.processingOrchestrator,
      this.eventStore
    );
  }
  
  getExportVoiceNoteUseCase(): ExportVoiceNoteUseCase {
    return new ExportVoiceNoteUseCase(this.voiceNoteRepository);
  }
  
  getMigrateAnonymousToUserUseCase(): MigrateAnonymousToUserUseCase {
    return new MigrateAnonymousToUserUseCase(
      this.prisma
    );
  }

  // Entity use case getters
  getCreateEntityUseCase(): CreateEntityUseCase {
    return new CreateEntityUseCase(this.entityRepository);
  }

  getUpdateEntityUseCase(): UpdateEntityUseCase {
    return new UpdateEntityUseCase(this.entityRepository);
  }

  getDeleteEntityUseCase(): DeleteEntityUseCase {
    return new DeleteEntityUseCase(this.entityRepository);
  }

  getListEntitiesUseCase(): ListEntitiesUseCase {
    return new ListEntitiesUseCase(this.entityRepository);
  }

  // Project use case getters
  getCreateProjectUseCase(): CreateProjectUseCase {
    return new CreateProjectUseCase(this.projectRepository);
  }

  getUpdateProjectUseCase(): UpdateProjectUseCase {
    return new UpdateProjectUseCase(this.projectRepository);
  }

  getDeleteProjectUseCase(): DeleteProjectUseCase {
    return new DeleteProjectUseCase(this.projectRepository);
  }

  getListProjectsUseCase(): ListProjectsUseCase {
    return new ListProjectsUseCase(this.projectRepository);
  }

  getManageProjectEntitiesUseCase(): ManageProjectEntitiesUseCase {
    return new ManageProjectEntitiesUseCase(this.projectRepository, this.entityRepository);
  }
  
  async shutdown(): Promise<void> {
    await this.prisma.$disconnect();
  }
}