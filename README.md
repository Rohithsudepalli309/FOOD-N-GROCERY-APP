# 🍕 F&G — The Food & Groceries Monorepo Platform 🛵

> **A massive, production-grade food and grocery delivery platform.**  
> Engineered from the ground up utilizing React Native (Expo) for frontend mobile clients, Next.js for web admin, and a 10-service Node.js event-driven Microservices architecture powered by PostgreSQL, Redis, and Apache Kafka.

[![Mobile](https://img.shields.io/badge/Mobile-Expo%2052-black?style=flat)](https://expo.dev)
[![Backend](https://img.shields.io/badge/Backend-Node.js%2018-green?style=flat)](https://nodejs.org)
[![Real-Time](https://img.shields.io/badge/Real--Time-Socket.IO%204-blue?style=flat)](https://socket.io)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20PostGIS-336791?style=flat)](https://postgresql.org)
[![Message Broker](https://img.shields.io/badge/Events-Apache%20Kafka-e51c24?style=flat)](https://kafka.apache.org)

---

## 📖 Table of Contents
1. [Platform Architecture](#-architecture)
2. [Tech Stack & Capabilities](#%EF%B8%8F-tech-stack--capabilities)
3. [The App Development Process](#-the-app-development-process)
   - [Phase Log & Roadmap](#multi-phase-roadmap--what-weve-built)
   - [Frontend Dev Workflow](#frontend-react-native--redux-development)
   - [Backend Dev Workflow](#backend-microservices-development)
4. [The 10-Step Real-Time Order Lifecycle](#-the-10-step-order-lifecycle)
5. [Local Development & Quick Start](#-local-development--quick-start)
   - [Environment Configuration](#environment-configuration)
   - [Running the Services (Docker)](#running-the-backend-services-docker)
   - [Running the Mobile Apps](#running-the-mobile-apps-locally)
6. [Automated Testing Suite](#-automated-testing)

---

## 🏗️ Architecture

The platform operates as a massive monorepo managing **3 distinct frontend UI applications** and **10 independent backend microservices**, communicating securely via a programmatic REST API Gateway, Socket.IO websockets, and Apache Kafka messaging.

### The Monorepo Structure

```text
FOOD N GROCERY APP/
├── apps/
│   ├── mobile/              # React Native (Expo) — Consumer Food & Grocery App (20+ Screens)
│   ├── delivery-app/        # React Native (Expo) — Rider App (GPS tracking, earnings, jobs)
│   └── web-admin/           # Next.js 14 — Restaurant & Admin Web Dashboard
│
├── FG-App/ 
│   ├── services/
│   │   ├── api-gateway/     # Kong-style API Gateway, global error/rate limiting (Port 3000)
│   │   ├── auth-service/    # OTP via Twilio + JWT Session Authentication (Port 3001)
│   │   ├── restaurant-service/# Menus, Availability, Catalog (Port 3002)
│   │   ├── order-service/   # Order Lifecycle & Saga Coordinator for fallbacks (Port 3003)
│   │   ├── delivery-service/# Rider Tracking & Geo-spatial Redis queries (Port 3004)
│   │   ├── payment-service/ # Razorpay Integration & Automated Refunds (Port 3005)
│   │   ├── notification-service/ # Firebase Cloud Messaging (FCM) Push & SMS (Port 3006)
│   │   ├── realtime-service/# Socket.IO WebSockets serving all apps natively (Port 3007)
│   │   ├── search-service/  # High-speed Elasticsearch query engine (Port 3008)
│   │   └── analytics-service/# Business Intelligence & Surge Pricing Algorithms (Port 3009)
│   │
│   ├── shared/              # Shared Types, Utils (DB, Redis, Kafka clients), Winston Logger
│   ├── tests/               # Isolated Jest & Supertest Integration/Unit Test Suite workspace
│   └── infrastructure/      # Docker Compose, K8s manifests, Init SQL
```

---

## 🛠️ Tech Stack & Capabilities

| Component | Technology | Description |
|---|---|---|
| **Mobile Apps** | React Native (Expo 52), Redux Toolkit | Consumer & Delivery apps with beautiful fluid animations, Google Maps integration and Socket.IO real-time location mapping. |
| **Web Portal** | Next.js 14 | Responsive admin dashboard for restaurants to manage active order pipelines and menu visibility. |
| **API Gateway** | Express + `http-proxy-middleware` | Centralized secure routing, Auth header verification, JWT parsing, and unified logging. |
| **Microservices** | Node.js 18 + Express | Independent, domain-driven services decoupled by responsibilities. |
| **Database** | PostgreSQL + PostGIS | ACID compliant storage with advanced geospatial capabilities for tracking riders & restaurants. |
| **Cache & Geo** | Redis Cluster | High-performance in-memory caching and lightning fast `GEOADD`/`GEORADIUS` rider proximity queries. |
| **Event Bus** | Apache Kafka | Asynchronous event-driven architecture using `kafkajs` ensuring zero lost messages on order flows. |
| **Real-Time** | Socket.IO 4 | Multi-namespace WebSockets (`/orders`, `/riders`, `/restaurants`) for pushing live state. |
| **Payments** | Razorpay SDK | Robust Payment gateway, split payments, and fully automated refund queues. |
| **DevOps** | Docker Compose | Containerized highly reproducible local development environment. |

---

## 🧗 The App Development Process

This platform didn't appear overnight. It was forged through a strict, iterative phase-by-phase implementation plan, focusing first on UX, transitioning to state, then wiring up intense backend logic. 

**Here is how we built it (and how you should approach modifying it):**

### Multi-Phase Roadmap & What We've Built
**Phase 0-1:** Establishing the Monorepo Root, Turbo build pipeline, and defining Shared TypeScript interfaces and constant routing maps.  
**Phase 2:** Building all Client Apps. The Consumer Mobile App (20+ screens with complex navigation like `FoodStackNavigator`, `GroceryStackNavigator`), the Delivery Rider App with background GPS APIs, and the Web Admin Next.js React app.  
**Phase 3-4:** Generating the 10 Express.js Microservices and bootstrapping the `docker-compose` infrastructure integrating Postgres, Redis, and Kafka.  
**Phase 7 (Sector 1):** Database persistence layer integration. Standardizing PostgreSQL connection pooling, creating resilient Redis clients, and implementing the Kafka Message Brokers across all internal services.  
**Phase 8-9 (Sector 2/3):** External APIs. Slapping in Razorpay processing, Twilio mock OTPs, Firebase Cloud Messaging. Then plumbing the mobile React Native apps up to the Edge UI utilizing Axios interceptors to auto-inject JWT tokens.  
**Phase 10 (Sector 4 - Reliability):** Engineering the complex logic:
- The **Saga Coordinator** running inside `order-service` which intercepts system failures (e.g. no riders available within 3km) and triggers automated rollbacks.
- The **Automated Refund** Kafka consumer inside `payment-service` executing Razorpay reverse-charges.
- The **Surge Pricing Algorithm** calculating supply vs. demand and mutating menu prices dynamically.  
**Phase 11-12:** DevOps Polish, Winston structured logging, and resolving monorepo peer dependency deployment clashes.  
**Phase 13:** Bootstrapping the **Jest testing ecosystem**, decoupling dependencies using inline mini-apps, and achieving extensive integration test coverage for Auth and Gateway workflows, along with unit tests validating Surge and Saga mathematics.

### Frontend (React Native + Redux) Development
**If you are building new mobile screens:**
1. **Navigation:** Screens live in `apps/mobile/src/screens/`. Hook new screens into `src/navigation/RootNavigator` or localized stack navigators (like `FoodStackNavigator.jsx`). Define path names inside `src/constants/routes.js`.
2. **Global State:** All client-side caching & state lives in `src/store/slices/`. 
3. **Real-time Middleware:** We utilize a custom `socketMiddleware.js` inside Redux. When `restaurant-service` fires an update across socket.io, the middleware intercepts the WS frame and automatically fires a Redux standard `dispatch()`, updating UI hooks instantly without polling APIs.
4. **Themeing:** Stick strictly to colors and typographies mapped in `src/constants/theme.js` to ensure the app maintains its premium dark-mode feeling aesthetic. 

### Backend (Microservices) Development
**If you are touching the Node backend:**
1. **Never write monoliths.** If you introduce a system that does not fit an existing service, you must spin up a new service on an available port (`3010+`).
2. **Communicate async.** Order placing, driver assigning, order delivery — DO NOT use HTTP REST chains. Publish an event to Apache Kafka, and have the dependent services consume it.
3. **Central Logging.** Use `createLogger(serviceName)` imported from the `shared` workspace. Do not use `console.log`. Winston handles JSON formatting and feeds smoothly into Kibana/Elasticsearch pipelines later.

---

## 🔄 The 10-Step Order Lifecycle

Our flagship algorithmic flow that coordinates mobile phones, Kafka, Redis, and PostgreSQL in seconds.

1. **Cart & Checkout**: Customer fills cart in the Consumer React Native App.
2. **Payment**: Payment securely authorized via Razorpay.
3. **Order Placed**: Customer hits submit. API Gateway redirects to `order-service`, which saves to PostgreSQL and publishes `ORDER_PLACED` to the Kafka network.
4. **Restaurant Notification**: `realtime-service` consumes the Kafka blip, and pushes a targeted WebSocket frame directly to the Web Admin dashboard of the specific restaurant.
5. **Acceptance**: Restaurant kitchen clicks "Accept".
6. **Rider Assignment Magic**: `delivery-service` gets queried. It executes a `GEORADIUS` command against the Redis cluster running PostGIS bounding logic, locating the nearest Online Rider within 3,000 meters.
7. **Rider Tracking**: The assigned Rider's App triggers an OS-level GPS background task, pushing `[lat, lng]` to WebSockets every 3 seconds.
8. **Live Map**: Consumer app intercepts the WebSocket, utilizing Animated Maps to interpolate the bike icon smoothly down the street.
9. **Delivery**: Order marked as delivered, JWT sessions refreshed.
10. **Analytics**: Post-delivery metrics sent asynchronously to `analytics-service`, the Surge Pricing engines recalculate local area density.

*Note: The **Saga Coordinator** handles all edge cases. If a restaurant hits "Reject" or no rider is physically found within 3km on Redis, the Saga intercepts, kills the order state, and dumps a payload onto the Refund Queue for `payment-service` to give the user their money back instantly.*

---

## 💻 Local Development & Quick Start

### Environment Configuration

Before booting, you must place an `.env` file at the root directory of the codebase. Copy `.env.example` as a template and fill it in:

```bash
cp .env.example .env
```

**Key Required Variables:**
- `DATABASE_URL=postgresql://fg_user:fg_pass@localhost:5432/fg_db`
- `REDIS_URL=redis://localhost:6379`
- `KAFKA_BROKERS=localhost:9092`
- `GOOGLE_MAPS_API_KEY=` (Required for Rider Mapping)
- `JWT_SECRET=super_secret_dev_key`
- `RAZORPAY_KEY_ID=` & `RAZORPAY_KEY_SECRET=`
- `FCM_SERVER_KEY=` (Firebase Cloud Messaging)

### Running the Backend Services (Docker)

The fastest and most stable way to stand up the 10 microservices and 3 infrastructure databases (Postgres, Redis, Kafka) is through Docker Compose.

```bash
cd FG-App
# Build and stand up all services in detached mode
docker-compose -f infrastructure/docker/docker-compose.yml up -d --build

# Verify all containers indicate "Healthy" or "Up"
docker ps

# Watch logs of a specific service to debug Kafka or REST requests
docker-compose -f infrastructure/docker/docker-compose.yml logs -f order-service
```

*(Note: Data seeding for Postgres schema is automatically executed through `init.sql` upon first boot.)*

### Running the Mobile Apps Locally

You will need the **Expo Go** app installed on your physical mobile phone to run these efficiently via QR Code, or you can use Android Studio/XCode Simulator.

```bash
# 1. Back at the root folder, install all dependencies in the monorepo workspace
npm install

# 2. Boot the Consumer App Metro bundler
cd apps/mobile
npx expo start --clear

# 3. In a separate terminal, Boot the Delivery App
cd apps/delivery-app
npx expo start --clear
```

---

## 🧪 Automated Testing

We do not merge to `main` without testing complex architectural shifts. The project includes an isolated, highly-mocked automated testing suite using **Jest** and **Supertest** running out of a dedicated tests workspace inside `FG-App/tests/`.

The suite extensively covers API Gateway routing middleware, comprehensive Auth Service integration flows (OTP injection, JWT parsing), and unit testing isolated heavy mathematics (Surge Pricing multiplier limits, Order Saga state-machine transitions).

```bash
cd FG-App/tests

# Install isolated test dependencies bypassing Turbo/Monorepo limits
npm install 

# Execute the full extensive suite
npm test
```
