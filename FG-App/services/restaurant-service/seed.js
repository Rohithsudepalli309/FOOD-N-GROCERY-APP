// Connecting to PostgreSQL (will be run inside docker container)
// require('dotenv').config({ path: '../../.env' });
const { query } = require('../../shared/utils/db.js');

const RESTAURANTS = [
  { id: 'r1', name: 'Barbeque Nation', cuisine: ['North Indian', 'Barbeque'], rating: 4.5, reviewCount: 2847, deliveryTimeMin: 30, deliveryTimeMax: 45, deliveryFee: 29, minOrder: 299, lat: 28.6273, lng: 77.3660, address: 'Sector 62, Noida', isOpen: true, isVegOnly: false, offers: ['20% off above ₹499', 'Free delivery on first order'], tags: ['bbq', 'grill', 'trending'] },
  { id: 'r2', name: 'Pizza Hut', cuisine: ['Pizza', 'Italian'], rating: 4.2, reviewCount: 1543, deliveryTimeMin: 25, deliveryTimeMax: 40, deliveryFee: 29, minOrder: 149, lat: 28.6302, lng: 77.3701, address: 'Sector 63, Noida', isOpen: true, isVegOnly: false, offers: ['Buy 1 Get 1 on Tuesday', 'Free garlic bread on ₹399+'], tags: ['pizza', 'italian'] },
  { id: 'r3', name: "McDonald's", cuisine: ['Burger', 'Fast Food'], rating: 4.4, reviewCount: 3201, deliveryTimeMin: 20, deliveryTimeMax: 35, deliveryFee: 0, minOrder: 99, lat: 28.6250, lng: 77.3600, address: 'Sector 18, Noida', isOpen: true, isVegOnly: false, offers: ['Free McFlurry on ₹299+'], tags: ['burger', 'fast food'] },
  { id: 'r4', name: "Domino's Pizza", cuisine: ['Pizza', 'Pasta'], rating: 4.1, reviewCount: 2190, deliveryTimeMin: 25, deliveryTimeMax: 35, deliveryFee: 29, minOrder: 149, lat: 28.6320, lng: 77.3720, address: 'Sector 62, Noida', isOpen: true, isVegOnly: false, offers: ['30 min guarantee or free'], tags: ['pizza', 'pasta'] },
  { id: 'r5', name: 'Biryani Blues', cuisine: ['Biryani', 'Hyderabadi'], rating: 4.6, reviewCount: 987, deliveryTimeMin: 35, deliveryTimeMax: 50, deliveryFee: 39, minOrder: 199, lat: 28.6265, lng: 77.3660, address: 'Sector 61, Noida', isOpen: true, isVegOnly: false, offers: ['Free raita on biryani orders'], tags: ['biryani', 'hyderabadi'] },
];

const MENUS = {
  r1: [
    { id: 'm1', name: 'Chicken Biryani', description: 'Tender chicken in aromatic basmati rice', price: 299, isVeg: false, isAvailable: true, category: 'Biryani', nutritionFacts: { calories: 520, protein: 28, carbs: 65, fat: 14 } },
    { id: 'm2', name: 'Paneer Tikka', description: 'Smoky cottage cheese with bell peppers', price: 249, isVeg: true, isAvailable: true, category: 'Starters' },
    { id: 'm3', name: 'Dal Makhani', description: 'Slow-cooked black lentils in buttery gravy', price: 199, isVeg: true, isAvailable: true, category: 'Mains' },
    { id: 'm4', name: 'Gulab Jamun', description: '2 pcs warm gulab jamun with ice cream', price: 99, isVeg: true, isAvailable: true, category: 'Desserts' },
  ],
  r2: [
    { id: 'm5', name: 'Margherita Pizza', description: 'Classic tomato, mozzarella, basil', price: 199, isVeg: true, isAvailable: true, category: 'Pizzas' },
    { id: 'm6', name: 'Farm House Pizza', description: 'Capsicum, onion, tomato, mushroom', price: 299, isVeg: true, isAvailable: true, category: 'Pizzas' },
    { id: 'm7', name: 'Garlic Bread', description: 'Toasted bread with herb butter', price: 129, isVeg: true, isAvailable: true, category: 'Sides' },
  ],
};

const fs = require('fs');
const path = require('path');

async function seed() {
  console.log('🌱 Seeding PostgreSQL...');
  try {
    // 0. Recreate Schema
    console.log('📦 Recreating schema from init.sql...');
    const schemaSql = fs.readFileSync(path.join(__dirname, '../../infrastructure/docker/init.sql'), 'utf8');
    await query(schemaSql);
    console.log('✅ Schema created successfully.');

    // 1. Insert Restaurants
    for (const r of RESTAURANTS) {
      // Use ST_MakePoint for geometry. PostGIS uses (longitude, latitude)
      const resQuery = `
        INSERT INTO restaurants (
          id, name, address, location, cuisine, is_open, is_veg_only, 
          rating, review_count, delivery_time_min, delivery_time_max, 
          delivery_fee, min_order, offers, tags
        ) VALUES (
          $1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15, $16
        ) ON CONFLICT (id) DO NOTHING;
      `;
      // Convert id (e.g. 'r1') to UUID format: generate a deterministic UUID or just insert as a string if mapped to uuid in DB?
      // Wait, 'r1' is not a valid UUID. The schema expects UUID.
      // We will map 'r1' -> '11111111-1111-1111-1111-111111111111'
      const uuid = r.id.replace('r', '').padStart(12, '0');
      const formattedId = `00000000-0000-0000-0000-${uuid}`;
      
      await query(resQuery, [
        formattedId, r.name, r.address, r.lng, r.lat, r.cuisine, 
        r.isOpen, r.isVegOnly, r.rating, r.reviewCount, 
        r.deliveryTimeMin, r.deliveryTimeMax, r.deliveryFee, 
        r.minOrder, r.offers, r.tags
      ]);
      console.log(`✅ Seeded restaurant: ${r.name}`);

      // 2. Insert Menus for this restaurant
      if (MENUS[r.id]) {
        for (const item of MENUS[r.id]) {
          const itemUuid = item.id.replace('m', '').padStart(12, '0');
          const formattedItemId = `11111111-1111-1111-1111-${itemUuid}`;
          
          const menuQuery = `
            INSERT INTO menu_items (
              id, restaurant_id, name, description, category, 
              price, is_veg, is_available, nutrition_facts
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9
            ) ON CONFLICT (id) DO NOTHING;
          `;
          await query(menuQuery, [
            formattedItemId, formattedId, item.name, item.description, 
            item.category, item.price, item.isVeg, item.isAvailable, 
            item.nutritionFacts ? JSON.stringify(item.nutritionFacts) : null
          ]);
        }
        console.log(`✅ Seeded ${MENUS[r.id].length} menu items for ${r.name}`);
      }
    }
    console.log('🎉 Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
