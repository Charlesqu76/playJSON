type EventHandler = (...args: any[]) => void;

export default class EventEmitter {
  private events: { [key: string | symbol]: EventHandler[] } = {};

  on(event: string | symbol, handler: EventHandler) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(handler);
  }

  off(event: string | symbol, handler: EventHandler) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((h) => h !== handler);
  }

  emit(event: string | symbol, ...args: any[]) {
    if (!this.events[event]) return;
    this.events[event].forEach((handler) => handler(...args));
  }
}
