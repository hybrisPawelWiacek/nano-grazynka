import { PrismaClient } from '@prisma/client';
import { EventStore } from '../../domain/repositories/EventStore';
import { DomainEvent } from '../../domain/events/DomainEvent';

export class EventStoreImpl implements EventStore {
  constructor(private prisma: PrismaClient) {}

  async save(event: DomainEvent): Promise<void> {
    await this.prisma.event.create({
      data: {
        eventId: event.eventId,
        aggregateId: event.aggregateId,
        eventType: event.eventType,
        payload: JSON.stringify(event.payload),
        occurredAt: event.occurredAt
      }
    });
  }

  async findByAggregateId(aggregateId: string): Promise<DomainEvent[]> {
    const events = await this.prisma.event.findMany({
      where: { aggregateId },
      orderBy: { occurredAt: 'asc' }
    });

    return events.map(e => ({
      aggregateId: e.aggregateId,
      eventType: e.eventType,
      payload: e.eventData as any,
      occurredAt: e.occurredAt,
      userId: e.userId
    }));
  }

  async findByEventType(eventType: string, limit?: number): Promise<DomainEvent[]> {
    const events = await this.prisma.event.findMany({
      where: { eventType },
      orderBy: { occurredAt: 'desc' },
      take: limit
    });

    return events.map(e => ({
      aggregateId: e.aggregateId,
      eventType: e.eventType,
      payload: e.eventData as any,
      occurredAt: e.occurredAt,
      userId: e.userId
    }));
  }
}