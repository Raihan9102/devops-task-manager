# 🚀 DevOps Task Manager — Production-Grade REST API

> A real-world DevOps learning project: Node.js REST API with full CI/CD pipeline, Docker containerization, Nginx reverse proxy, and Prometheus + Grafana monitoring.

![Node.js](https://img.shields.io/badge/Node.js-22-green?logo=node.js)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)
![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-black?logo=github-actions)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)

---

## 🏗️ Architecture

```
Internet → Nginx (80/443) → Node.js API (3000) → PostgreSQL (5432)
                                   ↓
                         Prometheus (9090) → Grafana (3001)
```

## 📁 Project Structure

```
devops-task-manager/
├── src/
│   ├── app.js                    # Main Express app + server bootstrap
│   ├── config/
│   │   ├── app.js                # App configuration from env vars
│   │   └── database.js           # Sequelize + PostgreSQL connection
│   ├── controllers/              # HTTP request/response handlers
│   │   ├── auth.controller.js
│   │   └── task.controller.js
│   ├── middlewares/              # Express middlewares
│   │   ├── auth.middleware.js    # JWT authentication + authorization
│   │   └── error.middleware.js   # Global error handler
│   ├── models/                   # Sequelize ORM models
│   │   ├── User.js
│   │   └── Task.js
│   ├── routes/                   # Route definitions
│   │   ├── auth.routes.js
│   │   └── task.routes.js
│   ├── services/                 # Business logic layer
│   │   ├── auth.service.js
│   │   └── task.service.js
│   ├── utils/                    # Helpers & utilities
│   │   ├── AppError.js           # Custom error class
│   │   └── response.js           # Standard API response format
│   └── validators/
│       └── index.js              # Joi request validation schemas
├── tests/
│   ├── unit/                     # Unit tests (mocked)
│   └── integration/              # Integration tests (real DB)
├── nginx/
│   └── nginx.conf                # Nginx reverse proxy config
├── monitoring/
│   └── prometheus/
│       └── prometheus.yml        # Prometheus scrape config
├── scripts/
│   └── init.sql                  # Database initialization
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # GitHub Actions CI/CD pipeline
├── Dockerfile                    # Multi-stage production Docker build
├── docker-compose.yml            # Full stack local environment
├── .env.example                  # Environment variables template
└── package.json
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22 (LTS) |
| Framework | Express.js |
| Database | PostgreSQL 16 + Sequelize ORM |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Validation | Joi |
| Container | Docker (multi-stage build) |
| Orchestration | Docker Compose |
| Reverse Proxy | Nginx |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana |
| Testing | Jest + Supertest |

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20
- Docker Desktop
- Git

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/devops-task-manager.git
cd devops-task-manager
cp .env.example .env
npm install
```

### 2. Run Locally (Development — needs PostgreSQL)

```bash
npm run dev
```

### 3. Run with Docker (Full Stack — Recommended)

```bash
# Start all services (API + PostgreSQL + Nginx + Prometheus + Grafana)
docker compose up -d

# Check logs
docker compose logs -f api

# Stop all services
docker compose down
```

---

## 📡 API Endpoints

Base URL: `http://localhost:3000/api/v1`

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/register` | Register new user | ❌ |
| `POST` | `/auth/login` | Login + get JWT | ❌ |
| `GET` | `/auth/profile` | Get current user | ✅ |

### Tasks
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/tasks` | List tasks (paginated) | ✅ |
| `GET` | `/tasks/stats` | Task statistics | ✅ |
| `GET` | `/tasks/:id` | Get single task | ✅ |
| `POST` | `/tasks` | Create task | ✅ |
| `PUT` | `/tasks/:id` | Update task | ✅ |
| `DELETE` | `/tasks/:id` | Delete task (soft) | ✅ |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | App health status |

---

## 🔐 Authentication

```bash
# 1. Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Raihan", "email": "raihan@test.com", "password": "Test@12345"}'

# 2. Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "raihan@test.com", "password": "Test@12345"}'

# 3. Use token
curl http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🧪 Testing

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# With coverage report
npm run test:coverage
```

---

## 🐳 Docker Commands

```bash
# Build image
npm run docker:build

# Start full stack
npm run docker:run

# View API logs
npm run docker:logs

# Stop everything
npm run docker:stop

# Clean up (remove volumes)
npm run docker:clean
```

---

## 📊 Monitoring

After running `docker compose up`:

| Service | URL |
|---------|-----|
| API | http://localhost:3000 |
| Nginx | http://localhost:80 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 (admin/admin123) |

---

## 🔄 CI/CD Pipeline

GitHub Actions pipeline runs on every push:

```
Push to GitHub
    ↓
1. 🧪 Lint & Test (with PostgreSQL service container)
    ↓
2. 🔒 Security Scan (Trivy + npm audit)
    ↓
3. 🐳 Build & Push Docker image to GHCR
    ↓
4. 🚀 Deploy to Staging (develop branch)
    ↓
5. 🌍 Deploy to Production (main branch)
```

---

## 📖 DevOps Concepts Covered

- ✅ **Containerization** — Multi-stage Dockerfile
- ✅ **Docker Compose** — Multi-service local environment
- ✅ **CI/CD** — Full automated pipeline with GitHub Actions
- ✅ **Reverse Proxy** — Nginx with rate limiting & security headers
- ✅ **Monitoring** — Prometheus metrics + Grafana dashboard
- ✅ **Health Checks** — Docker health checks on all services
- ✅ **Security** — JWT auth, Helmet, rate limiting, secret management
- ✅ **Testing** — Unit tests with Jest
- ✅ **12-Factor App** — Config via environment variables
- ✅ **Graceful Shutdown** — SIGTERM/SIGINT handling
