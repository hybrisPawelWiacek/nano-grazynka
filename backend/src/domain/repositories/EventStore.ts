import { DomainEvent } from '../events/DomainEvent';

export interface EventStore {
  append(event: DomainEvent): Promise<void>;
  getEvents(aggregateId: string): Promise<DomainEvent[]>;
  getAllEvents(fromDate?: Date): Promise<DomainEvent[]>;
}