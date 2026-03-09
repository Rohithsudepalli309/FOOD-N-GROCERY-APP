/**
 * Restaurant Service — Menus, Availability, Hours
 * Port: 3002
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { haversineKm } = require('../../shared/utils/index.js');
const { createLogger } = require('../../shared/utils/logger.js');

const logger = createLogger('restaurant-service');
const app = express();
app.use(cors()); app.use(express.json());

// ── Seeded Restaurant Data ─────────────────────────────────────────────────
const RESTAURANTS = {
  r1: { id: 'r1', name: 'Barbeque Nation', cuisine: ['North Indian', 'Barbeque'], rating: 4.5, reviewCount: 2847, deliveryTimeMin: 30, deliveryTimeMax: 45, deliveryFee: 29, minOrder: 299, lat: 28.6273, lng: 77.3660, address: 'Sector 62, Noida', isOpen: true, isVegOnly: false, offers: ['20% off above ₹499', 'Free delivery on first order'], tags: ['bbq', 'grill', 'trending'] },
  r2: { id: 'r2', name: 'Pizza Hut', cuisine: ['Pizza', 'Italian'], rating: 4.2, reviewCount: 1543, deliveryTimeMin: 25, deliveryTimeMax: 40, deliveryFee: 29, minOrder: 149, lat: 28.6302, lng: 77.3701, address: 'Sector 63, Noida', isOpen: true, isVegOnly: false, offers: ['Buy 1 Get 1 on Tuesday', 'Free garlic bread on ₹399+'], tags: ['pizza', 'italian'] },
  r3: { id: 'r3', name: "McDonald's", cuisine: ['Burger', 'Fast Food'], rating: 4.4, reviewCount: 3201, deliveryTimeMin: 20, deliveryTimeMax: 35, deliveryFee: 0, minOrder: 99, lat: 28.6250, lng: 77.3600, address: 'Sector 18, Noida', isOpen: true, isVegOnly: false, offers: ['Free McFlurry on ₹299+'], tags: ['burger', 'fast food'] },
  r4: { id: 'r4', name: "Domino's Pizza", cuisine: ['Pizza', 'Pasta'], rating: 4.1, reviewCount: 2190, deliveryTimeMin: 25, deliveryTimeMax: 35, deliveryFee: 29, minOrder: 149, lat: 28.6320, lng: 77.3720, address: 'Sector 62, Noida', isOpen: true, isVegOnly: false, offers: ['30 min guarantee or free'], tags: ['pizza', 'pasta'] },
  r5: { id: 'r5', name: 'Biryani Blues', cuisine: ['Biryani', 'Hyderabadi'], rating: 4.6, reviewCount: 987, deliveryTimeMin: 35, deliveryTimeMax: 50, deliveryFee: 39, minOrder: 199, lat: 28.6265, lng: 77.3660, address: 'Sector 61, Noida', isOpen: true, isVegOnly: false, offers: ['Free raita on biryani orders'], tags: ['biryani', 'hyderabadi'] },
};

const MENUS = {
  r1: [
    { id: 'm1', restaurantId: 'r1', name: 'Chicken Biryani', description: 'Tender chicken in aromatic basmati rice', price: 299, isVeg: false, isAvailable: true, category: 'Biryani', nutritionFacts: { calories: 520, protein: 28, carbs: 65, fat: 14 } },
    { id: 'm2', restaurantId: 'r1', name: 'Paneer Tikka', description: 'Smoky cottage cheese with bell peppers', price: 249, isVeg: true, isAvailable: true, category: 'Starters' },
    { id: 'm3', restaurantId: 'r1', name: 'Dal Makhani', description: 'Slow-cooked black lentils in buttery gravy', price: 199, isVeg: true, isAvailable: true, category: 'Mains' },
    { id: 'm4', restaurantId: 'r1', name: 'Gulab Jamun', description: '2 pcs warm gulab jamun with ice cream', price: 99, isVeg: true, isAvailable: true, category: 'Desserts' },
  ],
  r2: [
    { id: 'm5', restaurantId: 'r2', name: 'Margherita Pizza', description: 'Classic tomato, mozzarella, basil', price: 199, isVeg: true, isAvailable: true, category: 'Pizzas' },
    { id: 'm6', restaurantId: 'r2', name: 'Farm House Pizza', description: 'Capsicum, onion, tomato, mushroom', price: 299, isVeg: true, isAvailable: true, category: 'Pizzas' },
    { id: 'm7', restaurantId: 'r2', name: 'Garlic Bread', description: 'Toasted bread with herb butter', price: 129, isVeg: true, isAvailable: true, category: 'Sides' },
  ],
};

// ── Endpoints ──────────────────────────────────────────────────────────────

// GET /api/restaurants — List all (with optional lat/lng for distance + delivery time)
app.get('/api/restaurants', (req, res) => {
  const { lat, lng, sort = 'relevance' } = req.query;
  let list = Object.values(RESTAURANTS);

  if (lat && lng) {
    list = list.map(r => ({ ...r, distKm: haversineKm(parseFloat(lat), parseFloat(lng), r.lat, r.lng) }));
    if (sort === 'distance') list.sort((a, b) => a.distKm - b.distKm);
    else if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    else if (sort === 'delivery_time') list.sort((a, b) => a.deliveryTimeMin - b.deliveryTimeMin);
  }

  res.json({ restaurants: list, total: list.length });
});

// GET /api/restaurants/:id
app.get('/api/restaurants/:id', (req, res) => {
  const restaurant = RESTAURANTS[req.params.id];
  if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
  res.json(restaurant);
});

// GET /api/restaurants/:id/menu
app.get('/api/restaurants/:id/menu', (req, res) => {
  const { veg } = req.query;
  let items = MENUS[req.params.id] || [];
  if (veg === 'true') items = items.filter(i => i.isVeg);

  // Group into sections
  const sections = {};
  items.forEach(item => {
    if (!sections[item.category]) sections[item.category] = [];
    sections[item.category].push(item);
  });

  res.json({ sections: Object.entries(sections).map(([title, data]) => ({ title, data })), total: items.length });
});

// PATCH /api/restaurants/:id/availability
app.patch('/api/restaurants/:id/availability', (req, res) => {
  const { isOpen } = req.body;
  const r = RESTAURANTS[req.params.id];
  if (!r) return res.status(404).json({ error: 'Restaurant not found' });
  r.isOpen = isOpen;
  res.json({ success: true, isOpen });
});

// PATCH /api/restaurants/:id/menu/:menuId/availability
app.patch('/api/restaurants/:id/menu/:menuId/availability', (req, res) => {
  const { isAvailable } = req.body;
  const items = MENUS[req.params.id];
  if (!items) return res.status(404).json({ error: 'Menu not found' });
  const item = items.find(i => i.id === req.params.menuId);
  if (!item) return res.status(404).json({ error: 'Menu item not found' });
  item.isAvailable = isAvailable;
  res.json({ success: true, item });
});

app.get('/api/restaurants/health', (_, res) => res.json({ service: 'restaurant-service', status: 'ok', count: Object.keys(RESTAURANTS).length }));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => logger.info(`🍽️  Restaurant Service on port ${PORT}`));
