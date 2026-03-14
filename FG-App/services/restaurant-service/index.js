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

const { query } = require('../../shared/utils/db.js');

// ── Endpoints ──────────────────────────────────────────────────────────────

// GET /api/restaurants — List all (with optional lat/lng for distance + delivery time)
app.get('/api/restaurants', async (req, res) => {
  try {
    const { lat, lng, sort = 'relevance' } = req.query;
    let sql = `
      SELECT id, name, address, cuisine, is_open as "isOpen", is_veg_only as "isVegOnly",
             CAST(rating AS FLOAT), review_count as "reviewCount",
             delivery_time_min as "deliveryTimeMin", delivery_time_max as "deliveryTimeMax",
             CAST(delivery_fee AS FLOAT) as "deliveryFee", CAST(min_order AS FLOAT) as "minOrder",
             offers, tags,
             ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng
    `;
    let queryParams = [];

    if (lat && lng) {
      // PostGIS ST_DistanceSphere returns meters -> convert to km
      sql += `, (ST_DistanceSphere(location, ST_MakePoint($1, $2)) / 1000) as "distKm" `;
      // Note: ST_MakePoint takes (lng, lat)
      queryParams.push(parseFloat(lng), parseFloat(lat));
    }
    
    sql += ` FROM restaurants `;
    
    if (lat && lng && sort === 'distance') {
      sql += ` ORDER BY "distKm" ASC `;
    } else if (sort === 'rating') {
      sql += ` ORDER BY rating DESC `;
    } else if (sort === 'delivery_time') {
      sql += ` ORDER BY delivery_time_min ASC `;
    }
    
    const result = await query(sql, queryParams);
    res.json({ restaurants: result.rows, total: result.rowCount });
  } catch (err) {
    logger.error('Error fetching restaurants:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/restaurants/:id
app.get('/api/restaurants/:id', async (req, res) => {
  try {
    const sql = `
      SELECT id, name, address, cuisine, is_open as "isOpen", is_veg_only as "isVegOnly",
             CAST(rating AS FLOAT), review_count as "reviewCount",
             delivery_time_min as "deliveryTimeMin", delivery_time_max as "deliveryTimeMax",
             CAST(delivery_fee AS FLOAT) as "deliveryFee", CAST(min_order AS FLOAT) as "minOrder",
             offers, tags,
             ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng
      FROM restaurants WHERE id = $1
    `;
    const result = await query(sql, [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Restaurant not found' });
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Error fetching restaurant:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/restaurants/:id/menu
app.get('/api/restaurants/:id/menu', async (req, res) => {
  try {
    const { veg } = req.query;
    let sql = `
      SELECT id, restaurant_id as "restaurantId", name, description, category,
             CAST(price AS FLOAT), is_veg as "isVeg", is_available as "isAvailable", nutrition_facts as "nutritionFacts"
      FROM menu_items WHERE restaurant_id = $1
    `;
    const params = [req.params.id];
    if (veg === 'true') {
      sql += ` AND is_veg = true`;
    }
    
    const result = await query(sql, params);
    const items = result.rows;

    // Group into sections
    const sections = {};
    items.forEach(item => {
      if (!sections[item.category]) sections[item.category] = [];
      sections[item.category].push(item);
    });

    res.json({ sections: Object.entries(sections).map(([title, data]) => ({ title, data })), total: items.length });
  } catch (err) {
    logger.error('Error fetching menu:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/restaurants/:id/availability
app.patch('/api/restaurants/:id/availability', async (req, res) => {
  try {
    const { isOpen } = req.body;
    const sql = `UPDATE restaurants SET is_open = $1 WHERE id = $2 RETURNING id`;
    const result = await query(sql, [isOpen, req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Restaurant not found' });
    res.json({ success: true, isOpen });
  } catch (err) {
    logger.error('Error updating restaurant availability:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/restaurants/:id/menu/:menuId/availability
app.patch('/api/restaurants/:id/menu/:menuId/availability', async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const sql = `UPDATE menu_items SET is_available = $1 WHERE id = $2 AND restaurant_id = $3 RETURNING id`;
    const result = await query(sql, [isAvailable, req.params.menuId, req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Menu item not found' });
    res.json({ success: true, isAvailable });
  } catch (err) {
    logger.error('Error updating menu item availability:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/restaurants/health', async (_, res) => {
  try {
    const result = await query('SELECT COUNT(*) FROM restaurants');
    res.json({ service: 'restaurant-service', status: 'ok', count: parseInt(result.rows[0].count, 10) });
  } catch(err) {
    res.status(500).json({ service: 'restaurant-service', status: 'error' });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => logger.info(`🍽️  Restaurant Service on port ${PORT}`));
