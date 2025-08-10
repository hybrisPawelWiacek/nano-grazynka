import { ObservabilityProvider } from './index';
import { ConfigLoader } from '../../config/ConfigLoader';

export class CompositeObservabilityProvider implements ObservabilityProvider {
  private providers: ObservabilityProvider[];

  constructor(providers: ObservabilityProvider[]) {
    this.providers = providers.filter(p => p.isEnabled());
  }

  isEnabled(): boolean {
    return this.providers.some(p => p.isEnabled());
  }

  async initialize(): Promise<void> {
    await Promise.all(this.providers.map(p => p.initialize()));
  }

  async startTrace(name: string, metadata?: Record<string, any>): Promise<string> {
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await Promise.all(
      this.providers.map(p => p.startTrace(name, { ...metadata, traceId }))
    );
    return traceId;
  }

  async endTrace(traceId: string, result?: any, error?: Error): Promise<void> {
    await Promise.all(
      this.providers.map(p => p.endTrace(traceId, result, error))
    );
  }

  async logEvent(name: string, data?: Record<string, any>): Promise<void> {
    await Promise.all(
      this.providers.map(p => p.logEvent(name, data))
    );
  }

  getProviders(): ObservabilityProvider[] {
    return this.providers;
  }
}