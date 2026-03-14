-- F&G Production Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For delivery geospatial queries

-- ── Clean Reset ──────────────
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ── Users & Auth ─────────────
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'customer', -- customer, rider, restaurant_admin
    email VARCHAR(255),
    wallet_balance INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Restaurants & Menus ──────
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    address VARCHAR(255),
    location GEOGRAPHY(Point, 4326) NOT NULL,
    cuisine VARCHAR(100)[] DEFAULT '{}',
    is_open BOOLEAN DEFAULT true,
    is_veg_only BOOLEAN DEFAULT false,
    rating FLOAT DEFAULT 0.0,
    review_count INT DEFAULT 0,
    delivery_time_min INT DEFAULT 20,
    delivery_time_max INT DEFAULT 45,
    delivery_fee INT DEFAULT 0,
    min_order INT DEFAULT 0,
    offers VARCHAR(200)[] DEFAULT '{}',
    tags VARCHAR(100)[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    price INT NOT NULL, -- in paise/cents or rupees? In mock it's rupees (e.g. 299). Let's assume Rupees for simplicity as per mock.
    is_veg BOOLEAN DEFAULT true,
    is_available BOOLEAN DEFAULT true,
    nutrition_facts JSONB
);

-- ── Orders ───────────────────
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES users(id),
    restaurant_id UUID REFERENCES restaurants(id),
    rider_id UUID REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'placed', -- placed, confirmed, preparing, rider_assigned, picked_up, on_the_way, delivered, cancelled
    total_amount INT NOT NULL,
    delivery_address JSONB NOT NULL,
    delivery_location GEOGRAPHY(Point, 4326),
    otp VARCHAR(4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id),
    quantity INT NOT NULL DEFAULT 1,
    price_at_time INT NOT NULL
);

-- ── Payments ─────────────────
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    amount INT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, successful, failed, refunded
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_rider ON orders(rider_id);
CREATE INDEX idx_restaurants_location ON restaurants USING GIST (location);
