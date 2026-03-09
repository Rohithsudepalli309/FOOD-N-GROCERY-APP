# F&G — Food & Groceries 🍕🛵

> Production-grade food & grocery delivery platform — React Native + 10 Node.js Microservices

[![Mobile](https://img.shields.io/badge/Mobile-Expo%2052-black?style=flat)](https://expo.dev)
[![Backend](https://img.shields.io/badge/Backend-Node.js%2018-green?style=flat)](https://nodejs.org)
[![Real-Time](https://img.shields.io/badge/Real--Time-Socket.IO%204-blue?style=flat)](https://socket.io)

## Architecture

```
FG-App/
├── apps/
│   ├── mobile/          React Native (Expo) — Customer App
│   ├── web-admin/       Next.js — Restaurant & Admin Dashboard
│   └── delivery-app/    React Native — Rider App
├── services/
│   ├── api-gateway/     Kong-style gateway (port 3000)
│   ├── auth-service/    OTP + JWT (port 3001)
│   ├── restaurant-service/ Menus + availability (port 3002)
│   ├── order-service/   Order lifecycle (port 3003)
│   ├── delivery-service/ Rider + GEO (port 3004)
│   ├── payment-service/ Razorpay + wallet (port 3005)
│   ├── notification-service/ FCM + SMS (port 3006)
│   ├── realtime-service/  Socket.IO (port 3007)
│   ├── search-service/  Elasticsearch (port 3008)
│   └── analytics-service/ BI + ML hooks (port 3009)
├── shared/              Types, constants, utils
└── infrastructure/      Docker + K8s + CI/CD
```

## Quick Start

```bash
# Install all deps
npm install

# Start all services (Docker)
npm run docker:up

# Or start individually:
npm run start:gateway    # API Gateway :3000
npm run start:server     # Realtime :3007
npm run start:mobile     # Expo Go
npm run start:web        # Next.js :4000
```

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo 52) |
| Web | Next.js 14 |
| API Gateway | Express + http-proxy |
| Services | Node.js 18 + TypeScript |
| Real-Time | Socket.IO 4 |
| Queue | Apache Kafka (mock in dev) |
| Cache | Redis Cluster |
| Search | Elasticsearch |
| DB | PostgreSQL + PostGIS |
| Payments | Razorpay + UPI |
| Push | Firebase FCM |
| Maps | Google Maps Platform |
| DevOps | Docker + Kubernetes |
| CI/CD | GitHub Actions |

## Environment Setup

Copy `.env.example` to each service's `.env` and fill in:
- `GOOGLE_MAPS_API_KEY`
- `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET`
- `FCM_SERVER_KEY`
- `DATABASE_URL` (PostgreSQL)
- `REDIS_URL`
- `KAFKA_BROKERS`

## Order Lifecycle (10 Steps)

```
Customer Cart → Checkout → order_placed (Kafka) → Restaurant Notified
→ Restaurant Accepts → Rider Assignment (<2s via Redis GEO)
→ Rider GPS every 3s → Live Map → Delivered → Rating → ML Update
```
