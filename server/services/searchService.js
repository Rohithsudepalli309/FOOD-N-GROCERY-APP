const Fuse = require('fuse.js');

/**
 * SearchService — Fuse.js powered search (in-memory)
 * In production: replace with Elasticsearch + Redis cache
 */

const RESTAURANTS = [
  { id: 'r1', type: 'restaurant', name: 'Barbeque Nation', cuisine: 'North Indian, Barbeque', tags: ['bbq', 'grill', 'non-veg'], rating: 4.5, deliveryTime: 30, minOrder: 299 },
  { id: 'r2', type: 'restaurant', name: 'Pizza Hut', cuisine: 'Pizza, Italian, Desserts', tags: ['pizza', 'italian', 'fast food'], rating: 4.2, deliveryTime: 25, minOrder: 149 },
  { id: 'r3', type: 'restaurant', name: "McDonald's", cuisine: 'Burger, Fast Food', tags: ['burger', 'fast food', 'mcchicken'], rating: 4.4, deliveryTime: 20, minOrder: 99 },
  { id: 'r4', type: 'restaurant', name: "Domino's Pizza", cuisine: 'Pizza, Pasta', tags: ['pizza', 'pasta', 'italian'], rating: 4.1, deliveryTime: 25, minOrder: 149 },
  { id: 'r5', type: 'restaurant', name: 'Biryani Blues', cuisine: 'Biryani, Hyderabadi', tags: ['biryani', 'rice', 'hyderabadi'], rating: 4.6, deliveryTime: 35, minOrder: 199 },
];

const DISHES = [
  { id: 'd1', type: 'dish', name: 'Chicken Biryani', restaurant: 'Biryani Blues', price: 279, isVeg: false, tags: ['biryani', 'rice', 'chicken'] },
  { id: 'd2', type: 'dish', name: 'Margherita Pizza', restaurant: 'Pizza Hut', price: 199, isVeg: true, tags: ['pizza', 'veg', 'cheese'] },
  { id: 'd3', type: 'dish', name: 'McAloo Tikki Burger', restaurant: "McDonald's", price: 99, isVeg: true, tags: ['burger', 'veg', 'aloo'] },
  { id: 'd4', type: 'dish', name: 'Paneer Butter Masala', restaurant: 'Barbeque Nation', price: 249, isVeg: true, tags: ['paneer', 'curry', 'veg'] },
  { id: 'd5', type: 'dish', name: 'Chocolate Lava Cake', restaurant: 'Pizza Hut', price: 129, isVeg: true, tags: ['dessert', 'chocolate', 'sweet'] },
];

const GROCERY = [
  { id: 'g1', type: 'product', name: 'Amul Butter 500g', category: 'Dairy', price: 248, tags: ['butter', 'dairy', 'amul'] },
  { id: 'g2', type: 'product', name: 'Tata Salt 1kg', category: 'Essentials', price: 21, tags: ['salt', 'tata', 'essential'] },
  { id: 'g3', type: 'product', name: 'Aashirvaad Atta 5kg', category: 'Staples', price: 248, tags: ['atta', 'wheat', 'flour'] },
  { id: 'g4', type: 'product', name: 'Organic Tomatoes 1kg', category: 'Vegetables', price: 29, tags: ['tomato', 'vegetable', 'organic'] },
];

const ALL_ITEMS = [...RESTAURANTS, ...DISHES, ...GROCERY];

const FUSE_OPTIONS = {
  includeScore: true,
  threshold: 0.4,
  keys: [
    { name: 'name', weight: 2 },
    { name: 'cuisine', weight: 1.5 },
    { name: 'tags', weight: 1 },
    { name: 'category', weight: 0.8 },
  ],
};

class SearchService {
  constructor() {
    this.fuse = new Fuse(ALL_ITEMS, FUSE_OPTIONS);
    this.trending = ['Biryani', 'Pizza', 'Burger', 'Paneer', 'Chocolate'];
    this.queryCache = new Map();
    console.log('[SearchService] Fuse.js index built with', ALL_ITEMS.length, 'items');
  }

  query(q, type = 'all') {
    const cacheKey = `${q}:${type}`;
    if (this.queryCache.has(cacheKey)) return this.queryCache.get(cacheKey);

    const raw = this.fuse.search(q);
    let results = raw.map(r => ({ ...r.item, score: r.score }));

    if (type === 'restaurant') results = results.filter(r => r.type === 'restaurant');
    else if (type === 'dish') results = results.filter(r => r.type === 'dish');
    else if (type === 'product') results = results.filter(r => r.type === 'product');

    this.queryCache.set(cacheKey, results);
    setTimeout(() => this.queryCache.delete(cacheKey), 5 * 60 * 1000); // 5 min TTL
    return results;
  }

  autocomplete(q) {
    if (!q || q.length < 2) return this.trending.slice(0, 5);
    return this.fuse.search(q, { limit: 5 }).map(r => r.item.name);
  }

  getTrending() {
    return this.trending;
  }
}

module.exports = SearchService;
