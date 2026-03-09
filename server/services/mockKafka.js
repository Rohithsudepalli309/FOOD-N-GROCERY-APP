const { EventEmitter } = require('events');

/**
 * MockKafka — EventEmitter-based Kafka replacement for dev
 * Mimics Kafka Producer/Consumer API. Swap with KafkaJS in production.
 */
class MockKafka extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
    this.log = [];
    console.log('[MockKafka] Running with EventEmitter (no Kafka broker needed)');
  }

  /**
   * Publish a message to a topic
   */
  publish(topic, message) {
    const event = {
      topic,
      partition: 0,
      offset: this.log.length.toString(),
      timestamp: Date.now().toString(),
      value: message,
      ...message, // flatten for convenience
    };
    this.log.push(event);
    process.nextTick(() => this.emit(topic, event));
    console.log(`[KAFKA] → ${topic}`, JSON.stringify(message).slice(0, 120));
    return Promise.resolve(event);
  }

  /**
   * Subscribe to a topic
   */
  subscribe(topic, handler) {
    this.on(topic, handler);
    return this;
  }

  /**
   * Get recent log (like Kafka consumer group replay)
   */
  replay(topic, fromOffset = 0) {
    return this.log.filter(e => e.topic === topic).slice(fromOffset);
  }
}

module.exports = MockKafka;
