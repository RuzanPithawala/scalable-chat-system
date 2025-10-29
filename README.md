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

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Docker** and **Docker Compose**
- **Git**

### Verify installations:
```bash
node --version
npm --version
docker --version
docker-compose --version
```

## 🚀 Installation & Setup

### **Step 1: Clone the Repository**
```bash
git clone <repository-url>
cd scalable-chat-system
```

### **Step 2: Install Dependencies**

#### Install Chat Service Dependencies:
```bash
cd chat-service
npm install
cd ..
```

#### Install User Service Dependencies:
```bash
cd user-service
npm install
cd ..
```

#### Install Frontend Dependencies:
```bash
cd frontend
npm install
cd ..
```

### **Step 3: Configure Environment Variables**

#### Chat Service (.env):
Create `chat-service/.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=chatdb

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server
PORT=3002
```

#### User Service (.env):
Create `user-service/.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=userdb

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server
PORT=3001
```

### **Step 4: Start Infrastructure Services**

Navigate to the infrastructure directory and start all services:
```bash
cd infrastructure
docker-compose up -d
```

This will start:
- PostgreSQL (user database on port 5432)
- PostgreSQL (chat database on port 5433)
- Redis Master (port 6379)
- Redis Replica (port 6380)
- Redis Sentinel (port 26379)
- NGINX Load Balancer (port 80, 3001-3002)
- Prometheus (port 9090)
- Grafana (port 3003)
- User Service (2 instances)
- Chat Service (2 instances)
- Frontend (port 3000)

### **Step 5: Verify Services are Running**
```bash
docker ps
```

You should see all containers running with status "Up" and "healthy".

### **Step 6: Initialize Databases**

#### Create Chat Database:
```bash
docker exec -it postgres-chat psql -U postgres -c "CREATE DATABASE chatdb;"
```

#### Create User Database:
```bash
docker exec -it postgres-user psql -U postgres -c "CREATE DATABASE userdb;"
```

#### Run Database Migrations:

**Chat Service:**
```bash
cd chat-service
npm run migration:run
cd ..
```

**User Service:**
```bash
cd user-service
npm run migration:run
cd ..
```

## 🎯 Running the Application

### **Option 1: Using Docker Compose (Recommended)**

All services are already running if you completed Step 4 above.

Access the application:
- **Frontend**: http://localhost:3000
- **API Load Balancer**: http://localhost
- **Grafana Dashboard**: http://localhost:3003 (admin/admin)
- **Prometheus**: http://localhost:9090

### **Option 2: Running Services Locally (Development)**

If you want to run services locally for development:

#### Terminal 1 - Chat Service:
```bash
cd chat-service
npm run start:dev
```

#### Terminal 2 - User Service:
```bash
cd user-service
npm run start:dev
```

#### Terminal 3 - Frontend:
```bash
cd frontend
npm start
```

**Note**: When running locally, make sure Docker containers for databases and Redis are still running.

## 🧪 Running Tests

### **Chat Service Tests**

#### Run All Unit Tests:
```bash
cd chat-service
npm test
```

**Expected Output**: 81 tests passing
- Messages Service: 15 tests
- Chat Gateway: 21 tests
- Redis Service: 20 tests
- Messages Controller: 25 tests

#### Run Tests with Coverage:
```bash
npm run test:cov
```

#### Run E2E Tests:
```bash
npm run test:e2e
```

**Expected Output**: 3 E2E tests passing
- WebSocket connection test
- Join room and receive history test
- Send and receive message test

**Note**: E2E tests require PostgreSQL and Redis to be running.

### **User Service Tests**
```bash
cd user-service
npm test
```

### **Running All Tests**

To run all tests across all services:
```bash
# Chat Service
cd chat-service
npm test
npm run test:e2e

# User Service
cd user-service
npm test

# Return to root
cd ..
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

### **Database Migrations**

#### Create a new migration:
```bash
cd chat-service
npm run migration:generate -- src/migrations/MigrationName
```

#### Run migrations:
```bash
npm run migration:run
```

#### Revert last migration:
```bash
npm run migration:revert
```

## 📁 Project Structure
```
scalable-chat-system/
├── chat-service/           # Real-time messaging service
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
└── infrastructure/        # Docker infrastructure
    ├── docker-compose.yml # Service orchestration
    ├── nginx/             # Load balancer config
    └── prometheus/        # Monitoring config
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