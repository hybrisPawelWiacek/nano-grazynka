export type EntityType = 'person' | 'company' | 'technical' | 'product';

export interface Entity {
  id: string;
  userId: string;
  name: string;
  type: EntityType;
  value: string;
  aliases?: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEntityDTO {
  userId: string;
  name: string;
  type: EntityType;
  value: string;
  aliases?: string[];
  description?: string;
}

export interface UpdateEntityDTO {
  name?: string;
  type?: EntityType;
  value?: string;
  aliases?: string[];
  description?: string;
}

export interface EntityContext {
  compressed: string;
  people: string;
  technical: string;
  companies: string;
  products: string;
  detailed?: string;
}

export interface GroupedEntities {
  person?: Entity[];
  company?: Entity[];
  technical?: Entity[];
  product?: Entity[];
}