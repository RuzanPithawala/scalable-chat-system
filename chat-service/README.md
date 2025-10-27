# Chat Service

Real-time messaging service with WebSocket support, Redis pub/sub, and guaranteed message ordering.

## Features

- Real-time WebSocket communication
- Atomic sequence number generation using Redis
- Message persistence in PostgreSQL
- Redis Pub/Sub for multi-instance support
- REST API for message history
- JWT authentication

## Installation
```bash
npm install
```

## Environment Variables

Create a `.env` file:
```env
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=chatdb
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
PORT=3002
```

## Running
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Testing
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## API Documentation

See main README.md for API endpoints.