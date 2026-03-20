/**
 * Elasticsearch Index Initializer
 * Run once on first boot to establish index mappings with N-gram analyzers
 * Usage:  node services/search-service/es-init.js
 */
require('dotenv').config();
const { Client } = require('@elastic/elasticsearch');

const ES_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
const esClient = new Client({ node: ES_URL });

const AUTOCOMPLETE_ANALYZER = {
  analysis: {
    filter: {
      edge_ngram_filter: { type: 'edge_ngram', min_gram: 2, max_gram: 20 },
    },
    analyzer: {
      autocomplete: {
        type: 'custom', tokenizer: 'standard',
        filter: ['lowercase', 'edge_ngram_filter'],
      },
      autocomplete_search: {
        type: 'custom', tokenizer: 'standard', filter: ['lowercase'],
      },
    },
  },
};

const INDICES = [
  {
    name: 'restaurants',
    mappings: {
      properties: {
        id:           { type: 'keyword' },
        name:         { type: 'text', analyzer: 'autocomplete', search_analyzer: 'autocomplete_search', fields: { keyword: { type: 'keyword' } } },
        subtitle:     { type: 'text', analyzer: 'standard' },
        tags:         { type: 'keyword' },
        rating:       { type: 'float' },
        deliveryTime: { type: 'keyword' },
        minOrder:     { type: 'integer' },
        isOpen:       { type: 'boolean' },
        cuisine:      { type: 'keyword' },
        location: {
          type: 'geo_point',
        },
      },
    },
  },
  {
    name: 'menu_items',
    mappings: {
      properties: {
        id:           { type: 'keyword' },
        restaurantId: { type: 'keyword' },
        name:         { type: 'text', analyzer: 'autocomplete', search_analyzer: 'autocomplete_search', fields: { keyword: { type: 'keyword' } } },
        description:  { type: 'text', analyzer: 'standard' },
        subtitle:     { type: 'text' },
        tags:         { type: 'keyword' },
        price:        { type: 'float' },
        isVeg:        { type: 'boolean' },
        isAvailable:  { type: 'boolean' },
      },
    },
  },
  {
    name: 'products',
    mappings: {
      properties: {
        id:       { type: 'keyword' },
        name:     { type: 'text', analyzer: 'autocomplete', search_analyzer: 'autocomplete_search', fields: { keyword: { type: 'keyword' } } },
        subtitle: { type: 'text' },
        tags:     { type: 'keyword' },
        price:    { type: 'float' },
        category: { type: 'keyword' },
      },
    },
  },
];

async function initIndices() {
  console.log(`🔌 Connecting to Elasticsearch at ${ES_URL}...`);

  // Wait for ES to be ready (retry up to 10x)
  for (let i = 0; i < 10; i++) {
    try {
      await esClient.cluster.health({ wait_for_status: 'yellow', timeout: '10s' });
      console.log('✅ Elasticsearch is ready');
      break;
    } catch (e) {
      console.log(`⏳ Waiting for Elasticsearch... (attempt ${i + 1}/10)`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  for (const { name, mappings } of INDICES) {
    const exists = await esClient.indices.exists({ index: name });
    if (exists) {
      console.log(`ℹ️  Index '${name}' already exists — skipping`);
      continue;
    }

    await esClient.indices.create({
      index: name,
      settings: AUTOCOMPLETE_ANALYZER,
      mappings,
    });
    console.log(`✅ Created index '${name}' with autocomplete analyzer`);
  }

  console.log('🎉 Elasticsearch indices ready!');
  process.exit(0);
}

initIndices().catch(err => {
  console.error('❌ ES init failed:', err.message);
  process.exit(1);
});
