/**
 * Simple event bus for communication between components
 */

type EventCallback = (data: any) => void;

class EventBus {
  private events: Map<string, Set<EventCallback>> = new Map();
  
  /**
   * Subscribe to an event
   */
  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);
  }
  
  /**
   * Unsubscribe from an event
   */
  off(event: string, callback: EventCallback): void {
    this.events.get(event)?.delete(callback);
  }
  
  /**
   * Emit an event with optional data
   */
  emit(event: string, data?: any): void {
    this.events.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }
  
  /**
   * Clear all event listeners
   */
  clear(): void {
    this.events.clear();
  }
  
  /**
   * Remove all listeners for a specific event
   */
  clearEvent(event: string): void {
    this.events.delete(event);
  }
}

export const eventBus = new EventBus();