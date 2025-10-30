# Scalable Real-Time Chat System

A production-ready, horizontally scalable chat application built with microservices architecture, featuring real-time messaging, guaranteed message ordering, and multi-instance support.

## 🏗️ Architecture

- **User Service**: Authentication and user management
- **Chat Service**: Real-time messaging with WebSocket support
- **Frontend**: React-based web interface
- **Load Balancer**: NGINX for distributing traffic
- **Databases**: PostgreSQL for persistence
- **Cache/Pub-Sub**: Redis for real-time message broadcasting and sequence generation
- **Monitoring**: Prometheus & Grafana for observability

## ✨ Key Features

- ✅ **Real-time messaging** via WebSocket (Socket.IO)
- ✅ **Guaranteed message ordering** using Redis atomic counters
- ✅ **Horizontal scalability** with multiple service instances
- ✅ **Message persistence** in PostgreSQL
- ✅ **Redis Pub/Sub** for broadcasting across instances
- ✅ **JWT authentication**
- ✅ **Load balancing** with NGINX
- ✅ **Health monitoring** with Prometheus/Grafana
- ✅ **Comprehensive testing** (Unit, Integration, E2E)

## 📋 Prerequisites

**Only Docker is required!** Everything else runs in containers.

- **Docker Desktop** (includes Docker Compose)
- **Git**

### Verify Docker installation:
```bash
docker --version
docker-compose --version
```

> **Note:** Node.js and npm are only needed if you want to run tests or services locally outside Docker.

## 🚀 Quick Start (Recommended)

**TL;DR:** Clone → `docker-compose up` → Done! Everything is automated.

### **What You Get Automatically:**

✅ **Zero Configuration** - No manual setup required
✅ **Databases Created** - PostgreSQL databases auto-initialized
✅ **Tables Created** - Schema generated from code automatically
✅ **2 Service Instances** - Both services run with 2 instances for scaling demo
✅ **Load Balancing** - NGINX distributes traffic
✅ **Monitoring** - Pre-configured Grafana dashboards
✅ **All Dependencies** - Everything runs in Docker containers

### **Step 1: Clone the Repository**
```bash
git clone https://github.com/RuzanPithawala/scalable-chat-system.git
cd scalable-chat-system
```

### **Step 2: Start Everything with One Command**

```bash
cd infrastructure
docker-compose up --build -d
```

That's it! Wait 30-60 seconds for all services to start, then access:
- **Chat Application**: http://localhost:3000
- **Monitoring Dashboard**: http://localhost:3003 (admin/admin)

### **What This Command Does:**

<details>
<summary>Click to see all services started</summary>

- ✅ Build all Docker images
- ✅ Start PostgreSQL databases (2 instances: userdb + chatdb)
- ✅ Create databases automatically
- ✅ Create all tables automatically (TypeORM auto-synchronization)
- ✅ Start Redis (Master + Replica + Sentinel)
- ✅ Start NGINX load balancer
- ✅ Start User Service (2 instances)
- ✅ Start Chat Service (2 instances)
- ✅ Start React Frontend
- ✅ Start Prometheus metrics collection
- ✅ Start Grafana with pre-configured dashboards
- ✅ Start database exporters for monitoring

**Total: 16 containers**, all configured and connected automatically!

</details>

**Services Started:**
- PostgreSQL (user database on port 5432, chat database on port 5433)
- Redis Master (port 6379) + Redis Replica (port 6380) + Redis Sentinel (port 26379)
- NGINX Load Balancer (ports 80, 3001, 3002)
- Prometheus (port 9090) - Metrics collection
- Grafana (port 3003) - Monitoring dashboards
- User Service (2 instances behind load balancer)
- Chat Service (2 instances behind load balancer)
- Frontend (port 3000)

### **Step 3: Verify Services are Running**
```bash
docker ps
```

You should see all containers running with status "Up" and "healthy":
- postgres-user, postgres-chat
- redis-master, redis-replica-1, redis-sentinel-1
- nginx-lb
- user-service-1, user-service-2
- chat-service-1, chat-service-2
- frontend
- prometheus, grafana
- postgres-user-exporter, postgres-chat-exporter, redis-exporter

### **Step 4: Access the Application**

The system is now ready to use!

- **Frontend Application**: http://localhost:3000
- **User Service API**: http://localhost/users (load balanced)
- **Chat Service API**: http://localhost/messages (load balanced)
- **Grafana Dashboard**: http://localhost:3003 (admin/admin)
- **Prometheus**: http://localhost:9090

**No manual database setup needed!** The databases and tables are created automatically.

## 🎯 Alternative Setup: Local Development

If you want to run services locally (outside Docker) for development:

### **Step 1: Install Dependencies**

Install dependencies for all services from the root:
```bash
npm run install:all
```

Or install individually:
```bash
# Root dependencies (for running tests from root)
npm install

# Service dependencies
cd chat-service && npm install && cd ..
cd user-service && npm install && cd ..
cd frontend && npm install && cd ..
```

### **Step 2: Start Infrastructure Only**

Start only the databases and infrastructure services:
```bash
cd infrastructure
docker-compose up -d postgres-user postgres-chat redis-master nginx prometheus grafana
```

### **Step 3: Configure Environment Variables**

Create `.env` files if running services locally:

**chat-service/.env:**
```env
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=chatdb
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3002
```

**user-service/.env:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=userdb
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3001
```

### **Step 4: Run Services Locally**

Open separate terminals for each service:

**Terminal 1 - User Service:**
```bash
cd user-service
npm run start:dev
```

**Terminal 2 - Chat Service:**
```bash
cd chat-service
npm run start:dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm start
```

**Database tables are created automatically** when services start (TypeORM `synchronize: true`).

## 🧪 Running Tests

You can run all tests from the project root using convenient npm scripts:

### **Run All Unit Tests (Recommended)**
```bash
npm test
```

This will run all unit tests from both chat-service and user-service in a single command.

**Expected Output**: 96 tests passing
- Chat Service: 81 tests (Messages, Gateway, Redis, Controller)
- User Service: 15 tests (Auth, Users)

### **Run Service-Specific Tests**
```bash
# Chat service only
npm run test:chat

# User service only
npm run test:user
```

### **Run Tests with Coverage**
```bash
# Coverage for all services
npm run test:cov

# Coverage for specific service
npm run test:cov:chat
npm run test:cov:user
```

### **Run Tests in Watch Mode**
```bash
# Watch mode for chat service
npm run test:watch
# or
npm run test:chat:watch

# Watch mode for user service
npm run test:user:watch
```

### **Run E2E Tests**
```bash
npm run test:e2e
```

**Expected Output**: 3 E2E tests passing
- WebSocket connection test
- Join room and receive history test
- Send and receive message test

**Note**: E2E tests require PostgreSQL and Redis to be running via Docker:
```bash
cd infrastructure
docker-compose up -d postgres-chat redis-master
```

### **Run All Tests (Unit + E2E)**
```bash
npm run test:all
```

### **Test Structure**

Tests are co-located with source code in each service:
```
chat-service/
├── src/
│   ├── messages/
│   │   ├── messages.service.ts
│   │   ├── messages.service.spec.ts    # Unit tests
│   │   ├── chat.gateway.ts
│   │   └── chat.gateway.spec.ts        # Unit tests
│   └── redis/
│       ├── redis.service.ts
│       └── redis.service.spec.ts       # Unit tests
└── test/
    └── e2e/
        └── chat.e2e-spec.ts            # E2E tests

user-service/
└── src/
    ├── auth/
    │   ├── auth.service.ts
    │   └── auth.service.spec.ts        # Unit tests
    └── users/
        ├── users.service.ts
        ├── users.service.spec.ts       # Unit tests
        ├── users.controller.ts
        └── users.controller.spec.ts    # Unit tests
```

## 📊 Test Coverage Summary

### **Chat Service:**
- **81 Unit Tests** covering core business logic
- **3 E2E Tests** validating complete user flows
- **Coverage**: ~50% overall, 100% on critical paths

### **Key Test Scenarios:**
✅ Message creation with atomic sequence numbers  
✅ Redis Pub/Sub message broadcasting  
✅ WebSocket real-time communication  
✅ Message ordering and pagination  
✅ Multi-user chat rooms  
✅ Database persistence  

## 🔧 Development

### **Available Scripts**

#### Chat Service:
```bash
npm run start:dev     # Start in development mode with hot reload
npm run build         # Build for production
npm run start:prod    # Start production build
npm test              # Run unit tests
npm run test:watch    # Run tests in watch mode
npm run test:cov      # Run tests with coverage
npm run test:e2e      # Run end-to-end tests
```

#### User Service:
```bash
npm run start:dev     # Start in development mode
npm run build         # Build for production
npm run start:prod    # Start production build
npm test              # Run tests
```

#### Frontend:
```bash
npm start             # Start development server
npm run build         # Build for production
npm test              # Run tests
```

### **Database Schema Management**

The system uses TypeORM with `synchronize: true` which automatically creates and updates database tables based on your entity definitions.

**Development Setup:**
- Tables are created automatically when services start
- Schema changes are applied automatically based on entity modifications
- No manual migrations needed

**Production Recommendation:**
For production environments, you should:
1. Set `synchronize: false` in both services' `app.module.ts`
2. Use TypeORM migrations for controlled schema changes
3. Add migration scripts to package.json (currently not configured)

This ensures database schema changes are reviewed and applied in a controlled manner.

## 📁 Project Structure
```
scalable-chat-system/
├── chat-service/          # Real-time messaging service
│   ├── src/
│   │   ├── messages/      # Message handling logic
│   │   ├── redis/         # Redis service for pub/sub
│   │   ├── auth/          # JWT authentication
│   │   └── migrations/    # Database migrations
│   ├── test/              # E2E tests
│   └── package.json
├── user-service/          # User authentication service
│   ├── src/
│   │   ├── users/         # User management
│   │   ├── auth/          # Authentication logic
│   │   └── migrations/    # Database migrations
│   └── package.json
├── frontend/              # React web application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   └── hooks/         # Custom React hooks
│   └── package.json
├── infrastructure/        # Docker infrastructure
│   ├── docker-compose.yml # Service orchestration
│   ├── nginx/             # Load balancer config
│   ├── prometheus/        # Monitoring config
│   └── grafana/           # Dashboard provisioning
└── package.json           # Root package with aggregated scripts
```

## 🔍 API Endpoints

### **User Service (Port 3001)**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /users/profile` - Get user profile (JWT required)

### **Chat Service (Port 3002)**
- `GET /messages?chatId={id}&limit={n}&offset={m}` - Get message history
- `GET /messages/count?chatId={id}` - Get message count
- **WebSocket Events**:
  - `join-chat` - Join a chat room
  - `leave-chat` - Leave a chat room
  - `send-message` - Send a message
  - `message` - Receive a message
  - `user-joined` - User joined notification
  - `user-left` - User left notification

## 🐛 Troubleshooting

### **Database Connection Issues**

**Problem**: `database "chatdb" does not exist`

**Solution**:
```bash
docker exec -it postgres-chat psql -U postgres -c "CREATE DATABASE chatdb;"
```

### **Redis Connection Issues**

**Problem**: `Redis connection refused`

**Solution**: Ensure Redis is running:
```bash
docker ps | grep redis
docker start redis-master
```

### **Port Already in Use**

**Problem**: `EADDRINUSE: address already in use`

**Solution**: Stop the service using the port:
```bash
# Windows
netstat -ano | findstr :3002
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3002
kill -9 <PID>
```

### **Tests Failing**

**Problem**: E2E tests fail with database errors

**Solution**: Ensure all infrastructure services are running:
```bash
cd infrastructure
docker-compose up -d
```

Wait 30 seconds for services to be fully ready, then run tests again.

### **Docker Services Not Starting**

**Problem**: Containers exit immediately

**Solution**: Check logs:
```bash
docker-compose logs <service-name>
```

Common fixes:
- Ensure ports are not already in use
- Check .env files are correctly configured
- Verify database credentials

## 📈 Monitoring

The system includes a fully automated monitoring stack with Prometheus and Grafana. All dashboards and datasources are **automatically provisioned** - no manual configuration needed!

### **Grafana Dashboard**

Access Grafana at **http://localhost:3003**

**Default Credentials**:
- Username: `admin`
- Password: `admin`

**Pre-configured Dashboard**: http://localhost:3003/d/chat-system/chat-system-overview

The dashboard is automatically loaded on first startup and includes **9 monitoring panels**:

#### **Application Metrics**:
1. **User Service Memory Usage** - Memory consumption of both user-service instances
2. **Chat Service Memory Usage** - Memory consumption of both chat-service instances
3. **Service CPU Usage** - CPU utilization across all service instances
4. **Event Loop Lag** - Node.js event loop performance (milliseconds)

#### **Database Metrics**:
5. **PostgreSQL Active Connections** - Real-time database connections for userdb and chatdb
6. **PostgreSQL Transactions** - Database transaction rates

#### **Redis Metrics**:
7. **Redis Commands/sec** - Redis throughput and operations
8. **Redis Memory Usage** - Memory consumption by Redis
9. **Redis Connected Clients** - Active Redis client connections

#### **Service Health**:
- Live status gauges showing health of all service instances
- Real-time alerts for service failures

**Features**:
- ✅ **Auto-refresh**: All panels update every 5 seconds
- ✅ **Historical data**: View metrics over time (5m, 15m, 1h, 6h, 24h, 7d)
- ✅ **Zero configuration**: Dashboard and datasource are automatically provisioned
- ✅ **Production-ready**: All metrics exposed via `/metrics` endpoints

### **Prometheus**

Access Prometheus at **http://localhost:9090**

**Metrics Collection**:
- Scrapes all services every 15 seconds
- Stores time-series data for querying
- Monitors 8 targets:
  - user-service-1, user-service-2
  - chat-service-1, chat-service-2
  - postgres-user-exporter
  - postgres-chat-exporter
  - redis-exporter
  - prometheus (self-monitoring)

**Useful Queries**:
```promql
# Node.js Memory Usage
process_resident_memory_bytes{job="chat-service"}

# CPU Usage Rate
rate(process_cpu_seconds_total{job=~"user-service|chat-service"}[5m])

# Event Loop Lag
nodejs_eventloop_lag_mean_seconds * 1000

# PostgreSQL Connections
pg_stat_database_numbackends{datname="chatdb"}

# Redis Memory
redis_memory_used_bytes

# Redis Command Rate
rate(redis_commands_processed_total[5m])
```

### **Architecture**

The monitoring system uses:
- **Prometheus Exporters**:
  - `prometheuscommunity/postgres-exporter` for PostgreSQL metrics
  - `oliver006/redis_exporter` for Redis metrics
  - `@willsoto/nestjs-prometheus` for Node.js service metrics
- **Grafana Provisioning**: Datasources and dashboards are automatically configured via YAML files in `infrastructure/grafana/provisioning/`
- **No Manual Setup Required**: Everything works out of the box with `docker-compose up`

### **Monitoring Stack Ports**

| Service | Port | URL |
|---------|------|-----|
| Grafana Dashboard | 3003 | http://localhost:3003 |
| Prometheus | 9090 | http://localhost:9090 |
| PostgreSQL User Exporter | 9187 | http://localhost:9187/metrics |
| PostgreSQL Chat Exporter | 9188 | http://localhost:9188/metrics |
| Redis Exporter | 9121 | http://localhost:9121/metrics |
| User Service Metrics | 3001 | http://localhost:3001/metrics |
| Chat Service Metrics | 3002 | http://localhost:3002/metrics |

## 🛡️ Security Notes

⚠️ **Important**: The default configuration is for development only!

**For Production:**
1. Change all default passwords
2. Use strong JWT secrets
3. Enable HTTPS/TLS
4. Configure Redis authentication
5. Set up database SSL connections
6. Use environment-specific configurations
7. Enable rate limiting
8. Implement proper CORS policies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👥 Authors

- Ruzan Pithawala - Initial work

## 🙏 Acknowledgments

- NestJS framework
- Socket.IO for WebSocket support
- Redis for pub/sub and caching
- PostgreSQL for data persistence
- Docker for containerization