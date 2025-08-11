import { PrismaClient } from '@prisma/client';
import { EventStore } from '../../domain/repositories/EventStore';
import { DomainEvent } from '../../domain/events/DomainEvent';

export class EventStoreImpl implements EventStore {
  constructor(private prisma: PrismaClient) {}

  async append(event: DomainEvent): Promise<void> {
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

  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    const events = await this.prisma.event.findMany({
      where: { aggregateId },
      orderBy: { occurredAt: 'asc' }
    });

    return events.map(e => ({
      eventId: e.eventId,
      aggregateId: e.aggregateId,
      eventType: e.eventType,
      payload: JSON.parse(e.payload as string),
      occurredAt: e.occurredAt
    }));
  }

  async getAllEvents(fromDate?: Date): Promise<DomainEvent[]> {
    const events = await this.prisma.event.findMany({
      where: fromDate ? { occurredAt: { gte: fromDate } } : undefined,
      orderBy: { occurredAt: 'asc' }
    });

    return events.map(e => ({
      eventId: e.eventId,
      aggregateId: e.aggregateId,
      eventType: e.eventType,
      payload: JSON.parse(e.payload as string),
      occurredAt: e.occurredAt
    }));
  }

  // Legacy methods for backward compatibility
  async save(event: DomainEvent): Promise<void> {
    return this.append(event);
  }

  async findByAggregateId(aggregateId: string): Promise<DomainEvent[]> {
    return this.getEvents(aggregateId);
  }

  async findByEventType(eventType: string, limit?: number): Promise<DomainEvent[]> {
    const events = await this.prisma.event.findMany({
      where: { eventType },
      orderBy: { occurredAt: 'desc' },
      take: limit
    });

    return events.map(e => ({
      eventId: e.eventId,
      aggregateId: e.aggregateId,
      eventType: e.eventType,
      payload: JSON.parse(e.payload as string),
      occurredAt: e.occurredAt
    }));
  }
}