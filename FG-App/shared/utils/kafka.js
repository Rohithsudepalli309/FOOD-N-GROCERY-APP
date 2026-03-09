const { Kafka, Partitioners } = require('kafkajs');

const brokers = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'];

const kafka = new Kafka({
  clientId: 'fg-microservices',
  brokers,
  // ssl: true, sasl: { ... } // for prod MSK
});

// Singleton producer
const producer = kafka.producer({
  createPartitioner: Partitioners.DefaultPartitioner
});

let producerConnected = false;

const connectProducer = async () => {
  if (producerConnected) return;
  await producer.connect();
  producerConnected = true;
  console.log('✅ Kafka Producer connected');
};

const publishEvent = async (topic, key, message) => {
  await connectProducer();
  try {
    await producer.send({
      topic,
      messages: [{ key: String(key), value: JSON.stringify(message) }],
    });
  } catch (err) {
    console.error(`Error publishing to ${topic}:`, err);
  }
};

const createConsumer = async (groupId, topics, messageHandler) => {
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  
  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: false });
  }

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const val = JSON.parse(message.value.toString());
        await messageHandler(topic, val);
      } catch (err) {
        console.error(`Error processing msg from ${topic}:`, err);
      }
    },
  });

  return consumer;
};

module.exports = { kafka, publishEvent, createConsumer };
