# 🚀 Online Judge (OJ) — Competitive Programming Platform

A secure, multi-tenant competitive programming platform with AI-powered assistance, asynchronous code execution via a job queue, isolated Docker sandboxing, and comprehensive problem management.

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Running with Docker Compose](#-running-with-docker-compose)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Contributing Guidelines](#-contributing-guidelines)
- [License](#-license)

---

## ✨ Features

### 🎯 Core Functionality
- **Problem Management**: Create, edit, and manage coding problems with multiple difficulty levels
- **Multi-language Support**: Java, C++, and C programming languages
- **Isolated Code Execution**: Every submission runs in a hardened Docker sandbox (no network, read-only filesystem, CPU/memory limits)
- **Submission System**: Track user submissions with real execution time and real peak memory usage
- **User Authentication**: Secure JWT-based login/register with Google OAuth support
- **Profile Management**: User statistics and full submission history

### 🏢 Multi-Tenancy
- Full tenant isolation — users, problems, submissions, and AI hints are scoped per tenant
- `tenantId` enforced on every DB query; no cross-tenant data leakage

### 🤖 AI-Powered Features
- **Smart Hints**: AI-generated hints for problem-solving (max 2 per problem)
- **AI Chatbot**: Programming assistance and concept explanations
- **Semantic Caching**: Gemini API calls are deduplicated using cosine-similarity on `text-embedding-004` embeddings, dramatically reducing redundant API calls

### ⚡ Async Execution Queue
- **BullMQ + Redis**: Code submissions can be enqueued for asynchronous processing
- **Dedicated Worker Process**: Separate `submissionWorker.js` process handles job execution
- **Short-polling API**: `GET /api/v1/problems/jobs/:jobId/status` lets clients poll for results
- **Backward compatible**: Original synchronous endpoints still work alongside the new async ones

### 🔒 Security & Reliability
- **3-Role RBAC**: `user`, `problem-setter`, `admin` roles with fine-grained ownership checks
- **Compiler Microservice Auth**: Shared `COMPILER_API_KEY` (`x-api-key` header) prevents unauthorized access to the compiler
- **Rate Limiting**: API request throttling; bypass only allowed in non-production environments
- **Execution Timeouts**: 15 s runtime + 10 s compile timeout enforced inside Docker for C, C++, and Java
- **Helmet + CORS**: HTTP security headers and cross-origin request protection

### 📊 Observability
- **Prometheus metrics** at `/metrics` (via `prom-client`)
- **Structured logging** via Winston
- **p95 latency tracking** for HTTP requests and code execution
- **Health check** at `/health` with live p95 metrics

---

## 🏗️ Architecture

```
┌─────────────┐     HTTP      ┌──────────────────┐    BullMQ/Redis   ┌─────────────────────┐
│   Frontend  │ ────────────► │  Express Backend  │ ────────────────► │  Submission Worker  │
│  (React +   │               │  (API server)     │                   │  (submissionWorker) │
│   Nginx)    │               └──────────┬───────┘                   └──────────┬──────────┘
└─────────────┘                          │                                       │
                                         │  HTTP + x-api-key                     │ HTTP + x-api-key
                                         ▼                                       ▼
                               ┌──────────────────┐                   ┌──────────────────┐
                               │  Compiler Service │                   │  Compiler Service │
                               │  (Docker runner)  │                   │  (same instance)  │
                               └──────────────────┘                   └──────────────────┘
                                         │
                               ┌──────────────────┐
                               │  MongoDB Atlas    │   ← tenant-scoped collections
                               └──────────────────┘
                               ┌──────────────────┐
                               │  Redis            │   ← BullMQ queues
                               └──────────────────┘
```

### Service Layer (OOP)
All business logic is extracted from controllers into a `services/` layer:
- `ProblemService` — CRUD, tenant isolation, ownership enforcement
- `UserService` — profile, stats, submission history
- `SubmissionService` — submission queries scoped to tenant

---

## 🛠️ Tech Stack

### Frontend
- **React 19** — hooks and functional components
- **Vite** — fast build tool and dev server
- **Redux Toolkit** — state management
- **React Router** — client-side routing
- **Monaco Editor** — professional code editor (same as VS Code)

### Backend
- **Node.js / Express.js** — API server
- **MongoDB + Mongoose** — persistent storage (`maxPoolSize: 50`)
- **JWT** — stateless authentication
- **BullMQ + ioredis** — async job queue
- **prom-client** — Prometheus metrics
- **Winston** — structured logging

### AI Services
- **Google Gemini** (`gemini-2.5-flash`) — hints and chatbot
- **Gemini Embeddings** (`text-embedding-004`) — semantic cache lookups

### Infrastructure
- **Docker** — isolated execution sandbox per submission
- **Redis** — BullMQ job broker
- **Nginx** — reverse proxy and static file serving
- **docker-compose** — full-stack orchestration

---

## 📦 Installation (Local Dev)

### Prerequisites
- Node.js v18+
- MongoDB v6+ (or Atlas connection string)
- Redis v7+ (for the async queue)
- Docker (required for code execution sandbox)
- Google Cloud account (for Gemini AI features)

### 1. Clone
```bash
git clone <repository-url>
cd OJ
```

### 2. Install Dependencies

```bash
# Frontend
cd client && npm install

# Backend
cd ../server && npm install

# Compiler service
cd ../Compiler && npm install
```

### 3. Environment Setup
```bash
# Copy the example file and fill in your values
cp .env.example .env
```

See [Environment Variables](#-environment-variables) for all options.

### 4. Build the Sandbox Runner Image
```bash
docker build -t oj-runner:latest -f Compiler/runner.Dockerfile Compiler/
```

### 5. Start Services (4 terminals)

```bash
# Terminal 1 — Backend API server
cd server && npm run server

# Terminal 2 — BullMQ worker (async execution)
cd server && npm run worker:dev

# Terminal 3 — Compiler microservice
cd Compiler && npm run compiler

# Terminal 4 — Frontend
cd client && npm run dev
```

### Access Points
| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Prometheus metrics | http://localhost:5000/metrics |
| Health check | http://localhost:5000/health |
| Compiler | http://localhost:8000 |

---

## 🐳 Running with Docker Compose

The included `docker-compose.yml` spins up **all six services** with a single command:

```bash
# 1. Fill in secrets
cp .env.example .env   # then edit .env

# 2. Build the runner sandbox image
docker build -t oj-runner:latest -f Compiler/runner.Dockerfile Compiler/

# 3. Start everything
docker-compose up --build

# Stop and clean up
docker-compose down -v
```

### Services started by Compose

| Container | Role | Port |
|-----------|------|------|
| `oj_mongo` | MongoDB 7 | 27017 |
| `oj_redis` | Redis 7 | 6379 |
| `oj_compiler` | Compiler microservice | 8000 |
| `oj_backend` | Express API server | 5000 |
| `oj_worker` | BullMQ submission worker | — |
| `oj_frontend` | React app (Nginx) | 80 / 443 |

All services include **healthchecks** and start in the correct dependency order.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Secret for signing JWTs |
| `GEMINI_API_KEY` | ✅ | Google Gemini AI key |
| `COMPILER_URL` | ✅ | URL of compiler service (e.g. `http://localhost:8000/compile`) |
| `COMPILER_API_KEY` | ✅ | Shared secret between backend and compiler (`x-api-key` header) |
| `REDIS_HOST` | ✅ | Redis hostname (default: `localhost`) |
| `REDIS_PORT` | — | Redis port (default: `6379`) |
| `REDIS_PASSWORD` | — | Redis auth password |
| `SANDBOX_RUNNER_IMAGE` | — | Docker image for execution (default: `oj-runner:latest`) |
| `SANDBOX_MEMORY_MB` | — | Container memory limit in MB (default: `256`) |
| `SANDBOX_TIMEOUT_MS` | — | Overall sandbox timeout in ms (default: `25000`) |
| `WORKER_CONCURRENCY` | — | Number of parallel job workers (default: `5`) |
| `SEMANTIC_CACHE_THRESHOLD` | — | Cosine-similarity threshold for AI cache hit (default: `0.92`) |
| `SEMANTIC_CACHE_MAX_SIZE` | — | Max entries in semantic cache (default: `200`) |
| `PORT` | — | Backend server port (default: `5000`) |
| `NODE_ENV` | — | `development` or `production` |

---

## 📚 API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register new user |
| `POST` | `/api/v1/auth/login` | Login, returns JWT |
| `POST` | `/api/v1/auth/google` | Google OAuth |
| `POST` | `/api/v1/auth/forgotpassword` | Request password reset email |
| `PUT` | `/api/v1/auth/resetpassword/:token` | Reset password |

### Problems

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/problems` | — | List all published problems |
| `GET` | `/api/v1/problems/stats` | — | Aggregate stats by difficulty/category |
| `GET` | `/api/v1/problems/:id` | — | Get single problem |
| `POST` | `/api/v1/problems` | admin / problem-setter | Create problem |
| `PATCH` | `/api/v1/problems/:id` | admin / owner | Update problem |
| `DELETE` | `/api/v1/problems/:id` | admin / owner | Delete problem |
| `POST` | `/api/v1/problems/:id/run` | user | Run against public test cases (sync) |
| `POST` | `/api/v1/problems/:id/submit` | user | Submit solution (sync) |
| `POST` | `/api/v1/problems/:id/custom-test` | user | Run with custom input |
| `POST` | `/api/v1/problems/:id/run-async` | user | Enqueue run job → returns `{ jobId }` |
| `POST` | `/api/v1/problems/:id/submit-async` | user | Enqueue submit job → returns `{ jobId }` |
| `GET` | `/api/v1/problems/jobs/:jobId/status` | user | Poll async job state + result |
| `GET` | `/api/v1/problems/:problemId/status` | user | User's solve status for a problem |
| `GET` | `/api/v1/problems/:id/recent-submissions` | user | Recent submissions |

### User

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/user/profile` | Get own profile |
| `PATCH` | `/api/v1/user/profile` | Update profile / password |
| `GET` | `/api/v1/user/stats` | Solve stats by difficulty + category |
| `GET` | `/api/v1/user/submissions` | Paginated submission history |
| `GET` | `/api/v1/user/solved` | Paginated list of solved problems |

### AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/ai/hint` | Generate AI hint (max 2/problem; semantically cached) |
| `POST` | `/api/v1/ai/chatbot` | General or programming-specific AI chat (semantically cached) |
| `GET` | `/api/v1/ai/hint-count/:problemId` | Hints used / remaining |
| `GET` | `/api/v1/ai/hints/:problemId` | All hints received for a problem |

### Observability

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | JSON health + live p95 latency |
| `GET` | `/metrics` | Prometheus metrics scrape endpoint |

### Compiler Microservice

| Method | Endpoint | Header | Description |
|--------|----------|--------|-------------|
| `POST` | `/compile` | `x-api-key: <COMPILER_API_KEY>` | Compile & run code |

Request body:
```json
{
  "language": "cpp",
  "code": "...",
  "input": ""
}
```
Response includes `stdout`, `stderr`, `exitCode`, `execTime` (ms), and `memoryUsed` (MB).

---

## 🤝 Contributing Guidelines

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow existing code style (service-layer pattern, tenant-scoped queries)
4. Add or update tests as needed
5. Commit: `git commit -m 'feat: add amazing feature'`
6. Push and open a Pull Request

### Good First Issues
- **Frontend**: UI/UX polish, WebSocket-based async result streaming
- **Backend**: Persistent semantic cache (MongoDB Atlas Vector Search)
- **Testing**: Unit tests for services, integration tests for API endpoints
- **Security**: seccomp profile for Docker sandbox

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Issues

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Use GitHub Discussions for questions and ideas

## 🙏 Acknowledgments

- **Google Gemini AI** for AI-powered features
- **Monaco Editor** for the excellent code editing experience
- **BullMQ** for reliable job queue infrastructure
- **React Community** for the amazing ecosystem
- **Open Source Contributors** who made this project possible

---

**Happy Coding! 🎉**

*Built with ❤️ by the OJ Team*
