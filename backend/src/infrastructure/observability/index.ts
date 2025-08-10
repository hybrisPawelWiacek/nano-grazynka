import { Config } from '../../config/schema';

export interface ObservabilityProvider {
  initialize(): Promise<void>;
  traceStart(name: string, metadata?: Record<string, any>): string;
  traceEnd(traceId: string, result?: any, error?: Error): void;
  logMetric(name: string, value: number, tags?: Record<string, string>): void;
}

export class LangSmithProvider implements ObservabilityProvider {
  private traces = new Map<string, { name: string; startTime: number; metadata?: Record<string, any> }>();

  constructor(private config: Config['observability']['langsmith']) {}

  async initialize(): Promise<void> {
    if (!this.config.enabled) return;
    
    process.env.LANGCHAIN_TRACING_V2 = 'true';
    process.env.LANGCHAIN_API_KEY = this.config.apiKey;
    process.env.LANGCHAIN_PROJECT = this.config.project || 'nano-grazynka';
    process.env.LANGCHAIN_ENDPOINT = this.config.endpoint || 'https://api.smith.langchain.com';
    
    console.log('LangSmith observability initialized');
  }

  traceStart(name: string, metadata?: Record<string, any>): string {
    if (!this.config.enabled) return '';
    
    const traceId = `ls_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.traces.set(traceId, { name, startTime: Date.now(), metadata });
    
    return traceId;
  }

  traceEnd(traceId: string, result?: any, error?: Error): void {
    if (!this.config.enabled) return;
    
    const trace = this.traces.get(traceId);
    if (!trace) return;
    
    const duration = Date.now() - trace.startTime;
    this.traces.delete(traceId);
    
    const event = {
      name: trace.name,
      duration_ms: duration,
      metadata: trace.metadata,
      result: error ? undefined : result,
      error: error ? error.message : undefined,
      timestamp: new Date().toISOString(),
    };
    
    this.sendToLangSmith(event);
  }

  logMetric(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.config.enabled) return;
    
    const metric = {
      name,
      value,
      tags,
      timestamp: new Date().toISOString(),
    };
    
    this.sendToLangSmith(metric);
  }

  private async sendToLangSmith(data: any): Promise<void> {
    try {
      const response = await fetch(`${process.env.LANGCHAIN_ENDPOINT}/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.LANGCHAIN_API_KEY!,
        },
        body: JSON.stringify({
          project_name: process.env.LANGCHAIN_PROJECT,
          ...data,
        }),
      });
      
      if (!response.ok) {
        console.error('[LangSmith] Failed to send data:', await response.text());
      }
    } catch (error) {
      console.error('[LangSmith] Error sending data:', error);
    }
  }
}

export class OpenLLMetryProvider implements ObservabilityProvider {
  private traces = new Map<string, { name: string; startTime: number; metadata?: Record<string, any> }>();

  constructor(private config: Config['observability']['openllmetry']) {}

  async initialize(): Promise<void> {
    if (!this.config.enabled) return;
    
    process.env.OPENLLMETRY_API_KEY = this.config.apiKey;
    process.env.OPENLLMETRY_ENDPOINT = this.config.endpoint || 'https://api.openllmetry.io';
    
    console.log('OpenLLMetry observability initialized');
  }

  traceStart(name: string, metadata?: Record<string, any>): string {
    if (!this.config.enabled) return '';
    
    const traceId = `ollm_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.traces.set(traceId, { name, startTime: Date.now(), metadata });
    
    return traceId;
  }

  traceEnd(traceId: string, result?: any, error?: Error): void {
    if (!this.config.enabled) return;
    
    const trace = this.traces.get(traceId);
    if (!trace) return;
    
    const duration = Date.now() - trace.startTime;
    this.traces.delete(traceId);
    
    const span = {
      trace_id: traceId,
      name: trace.name,
      start_time: trace.startTime,
      end_time: Date.now(),
      duration_ms: duration,
      attributes: {
        ...trace.metadata,
        'llm.request.type': 'transcription',
        'llm.response.error': error ? error.message : undefined,
      },
      status: error ? 'ERROR' : 'OK',
    };
    
    this.sendToOpenLLMetry(span);
  }

  logMetric(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.config.enabled) return;
    
    const metric = {
      name,
      value,
      tags,
      timestamp: Date.now(),
      type: 'gauge',
    };
    
    this.sendToOpenLLMetry(metric);
  }

  private async sendToOpenLLMetry(data: any): Promise<void> {
    try {
      const response = await fetch(`${process.env.OPENLLMETRY_ENDPOINT}/v1/traces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENLLMETRY_API_KEY}`,
        },
        body: JSON.stringify({
          resource: {
            attributes: {
              'service.name': 'nano-grazynka',
              'service.version': '1.0.0',
            },
          },
          spans: Array.isArray(data) ? data : [data],
        }),
      });
      
      if (!response.ok) {
        console.error('[OpenLLMetry] Failed to send data:', await response.text());
      }
    } catch (error) {
      console.error('[OpenLLMetry] Error sending data:', error);
    }
  }
}

export class CompositeObservabilityProvider implements ObservabilityProvider {
  private providers: ObservabilityProvider[] = [];

  constructor(config: Config['observability']) {
    if (config.langsmith.enabled) {
      this.providers.push(new LangSmithProvider(config.langsmith));
    }
    if (config.openllmetry.enabled) {
      this.providers.push(new OpenLLMetryProvider(config.openllmetry));
    }
  }

  async initialize(): Promise<void> {
    await Promise.all(this.providers.map(p => p.initialize()));
  }

  traceStart(name: string, metadata?: Record<string, any>): string {
    const traceIds = this.providers.map(p => p.traceStart(name, metadata));
    return traceIds.join('|');
  }

  traceEnd(traceId: string, result?: any, error?: Error): void {
    const traceIds = traceId.split('|');
    this.providers.forEach((p, i) => {
      if (traceIds[i]) {
        p.traceEnd(traceIds[i], result, error);
      }
    });
  }

  logMetric(name: string, value: number, tags?: Record<string, string>): void {
    this.providers.forEach(p => p.logMetric(name, value, tags));
  }
}