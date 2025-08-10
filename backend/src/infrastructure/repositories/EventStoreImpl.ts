import { prisma } from '../database/client';
import { EventStore } from '../../domain/repositories/EventStore';
import { DomainEvent } from '../../domain/events/DomainEvent';
import { Prisma } from '@prisma/client';

export class EventStoreImpl implements EventStore {
  async append(event: DomainEvent): Promise<void> {
    await prisma.event.create({
      data: {
        eventId: event.eventId || crypto.randomUUID(),
        aggregateId: event.aggregateId,
        eventType: event.eventType,
        payload: JSON.stringify(event.payload),
        occurredAt: event.occurredAt,
      },
    });
  }

  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    const events = await prisma.event.findMany({
      where: { aggregateId },
      orderBy: { occurredAt: 'asc' },
    });

    return events.map((event) => ({
      eventId: event.eventId,
      aggregateId: event.aggregateId,
      eventType: event.eventType,
      payload: JSON.parse(event.payload),
      occurredAt: event.occurredAt,
    }));
  }

  async getEventsByType(
    eventType: string,
    options?: {
      limit?: number;
      offset?: number;
      since?: Date;
    }
  ): Promise<DomainEvent[]> {
    const where: Prisma.EventWhereInput = {
      eventType,
      ...(options?.since && { occurredAt: { gte: options.since } }),
    };

    const events = await prisma.event.findMany({
      where,
      take: options?.limit || 100,
      skip: options?.offset || 0,
      orderBy: { occurredAt: 'desc' },
    });

    return events.map((event) => ({
      eventId: event.eventId,
      aggregateId: event.aggregateId,
      eventType: event.eventType,
      payload: JSON.parse(event.payload),
      occurredAt: event.occurredAt,
    }));
  }

  async getLastEvent(aggregateId: string): Promise<DomainEvent | null> {
    const event = await prisma.event.findFirst({
      where: { aggregateId },
      orderBy: { occurredAt: 'desc' },
    });

    if (!event) return null;

    return {
      eventId: event.eventId,
      aggregateId: event.aggregateId,
      eventType: event.eventType,
      payload: JSON.parse(event.payload),
      occurredAt: event.occurredAt,
    };
  }

  async getAllEvents(fromDate?: Date): Promise<DomainEvent[]> {
    const where: Prisma.EventWhereInput = fromDate 
      ? { occurredAt: { gte: fromDate } }
      : {};

    const events = await prisma.event.findMany({
      where,
      orderBy: { occurredAt: 'asc' },
    });

    return events.map((event) => ({
      eventId: event.eventId,
      aggregateId: event.aggregateId,
      eventType: event.eventType,
      payload: JSON.parse(event.payload),
      occurredAt: event.occurredAt,
    }));
  }
}