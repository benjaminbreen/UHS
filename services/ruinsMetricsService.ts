import { eventBus } from './eventBus';

export type RuinsMetricEvent =
    | 'ruins.run.start'
    | 'ruins.run.end'
    | 'ruins.discovery.viewed'
    | 'ruins.llm.request'
    | 'ruins.translation.completed'
    | 'ruins.card.played';

export interface RuinsMetricPayload {
    [key: string]: unknown;
}

interface StoredEvent {
    id: RuinsMetricEvent;
    payload: RuinsMetricPayload;
    timestamp: number;
}

class RuinsMetricsService {
    private buffer: StoredEvent[] = [];

    constructor() {
        eventBus.on('ruins.metrics.flush', () => this.flushToConsole());
    }

    record(id: RuinsMetricEvent, payload: RuinsMetricPayload = {}) {
        const entry: StoredEvent = {
            id,
            payload,
            timestamp: Date.now()
        };
        this.buffer.push(entry);
        eventBus.emit(id, entry);
    }

    getEvents(): StoredEvent[] {
        return [...this.buffer];
    }

    flushToConsole(): void {
        if (this.buffer.length === 0) {
            console.info('[ruinsMetrics] No events recorded.');
            return;
        }
        console.table(
            this.buffer.map(event => ({
                event: event.id,
                time: new Date(event.timestamp).toISOString(),
                ...event.payload
            }))
        );
    }

    reset(): void {
        this.buffer = [];
    }
}

export const ruinsMetricsService = new RuinsMetricsService();
