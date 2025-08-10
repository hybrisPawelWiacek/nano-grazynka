export interface DomainEvent {
  eventId?: string;
  aggregateId: string;
  eventType: string;
  eventVersion?: number;
  occurredAt: Date;
  payload: Record<string, any>;
}

export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly occurredAt: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly eventType: string,
    public readonly payload: Record<string, any>
  ) {
    this.eventId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    this.occurredAt = new Date();
  }
}