const EventEmitter = require('events');

class SystemEvents extends EventEmitter {
  constructor() {
    super();
    this.recentEmits = new Set();
  }

  safeEmit(event, payload) {
    const key = `${event}-${payload?.ticket_id || ''}`;
    if (this.recentEmits.has(key)) {
      console.warn(`⚠️ Duplicate emit skipped: ${key}`);
      return;
    }
    console.log(`🚀 Emitting event once: ${key}`);
    this.emit(event, payload);
    this.recentEmits.add(key);
    setTimeout(() => this.recentEmits.delete(key), 2000); // prevent spamming
  }
}

module.exports = new SystemEvents();
