# PRD Compliance Remediation Tasks

This document outlines the actionable engineering tasks required to bring the OJ (Online Judge) platform into full compliance with its PRD. Tasks are prioritized by severity based on the gap analysis.

## 🔴 P0 - Critical Path (Must Fix)

### 1. Implement Multi-Tenancy Architecture
- [ ] **Schema Updates:** Add `tenantId` (ObjectId, ref: 'Tenant', required) to `User`, `Problem`, `Submission`, and `HintUsage` models. Add compound indexes including `tenantId`.
- [ ] **Tenant Model:** Create a new `Tenant` model to manage tenant-specific configs.
- [ ] **Auth Middleware:** Update `deserializeUser` in `server/middleware/auth.js` to extract `tenantId` from the JWT and attach it to `req.user` / `req.tenant`.
- [ ] **Query Scoping:** Update all `find()`, `findOne()`, `aggregate()`, and `create()` calls in controllers (`problem.js`, `user.js`, `aiController.js`) to enforce `tenantId` scoping.

### 2. Implement Semantic Caching for AI
- [ ] **Infrastructure:** Spin up a Redis instance or vector database (e.g., MongoDB Atlas Vector Search).
- [ ] **Embedding Generation:** Implement a helper function in `geminiHints.js` / `geminiChatbot.js` to generate embeddings for incoming user queries/code snippets using Gemini's embedding model.
- [ ] **Cache Middleware/Logic:** Before calling `generateContent`, generate the query embedding, do a similarity search against the cache.
- [ ] **Cache Miss/Hit Handling:** If similarity > threshold (e.g., 0.9), return the cached response. If miss, fetch from Gemini, then asynchronously store the query embedding and response in the cache.

### 3. Complete 3-Role RBAC Implementation
- [ ] **Schema Update:** Modify `User.js` role enum from `['user', 'admin']` to `['user', 'problem-setter', 'admin']`.
- [ ] **Authorization Update:** In `server/routes/problem.js`, modify route protection. E.g., `router.post('/', authorizeRoles('admin', 'problem-setter'), createProblem);`.
- [ ] **Problem Ownership Checks:** Ensure `problem-setter` can only edit/delete problems they authored, whereas `admin` can edit/delete any problem.

### 4. Patch Rate-Limiter Security Bypass
- [ ] **Fix Bypass:** In `server/middleware/rateLimiter.js`, modify the `skip` function to verify `process.env.NODE_ENV !== 'production'` before allowing the `x-test-mode` header to bypass limits.

---

## 🟠 P1 - Architecture & Accuracy (Should Fix)

### 5. Introduce Execution Queue (Scalability)
- [ ] **Install Message Broker:** Add BullMQ and Redis to the backend stack.
- [ ] **Producer:** Refactor `submitSolution` and `runCode` in `problem.js` to push jobs to a `submissionQueue` instead of blocking with synchronous Axios calls to the compiler.
- [ ] **Worker:** Create a worker process that consumes `submissionQueue`, sends the payload to the Compiler microservice, and processes the result.
- [ ] **Client Polling/WebSocket:** Implement a way for the frontend to receive asynchronous updates (e.g., short-polling a `/status/:jobId` endpoint or using Socket.io).

### 6. Implement Real Memory Tracking (Accuracy)
- [ ] **Remove Fake Data:** Remove `Math.floor(Math.random() * 50) + 10` in `server/controllers/problem.js`.
- [ ] **Extract Docker Stats:** In `Compiler/dockerRunner.js`, modify the docker run command/script to measure peak memory. One approach: write a wrapper script inside the container using `/usr/bin/time -v` to capture `Maximum resident set size`, or read from `/sys/fs/cgroup/memory/memory.max_usage_in_bytes`.
- [ ] **Return Memory Metric:** Pass the real memory usage back in the Compiler API response and store it in the `Submission` document.

### 7. Measure Execution Latency (Performance)
- [ ] **Instrumentation:** Add `prom-client` or integrate structured logging (e.g., Winston) with response time tracking (fixing the dead code in `server/index.js` L23-L33).
- [ ] **Track Percentiles:** Specifically track the p95 latency of the execution queue and compiler service to prove the 40% reduction PRD metric.

### 8. Authenticate Compiler Microservice (Security)
- [ ] **Shared Secret:** Add `COMPILER_API_KEY` to both the backend and compiler `.env` files.
- [ ] **Middleware:** Create a simple authentication middleware in `Compiler/index.js` to reject requests without a matching `x-api-key` header.
- [ ] **Update Axios Calls:** Ensure backend `axios.post` calls include the new header.

### 9. Enforce C/C++ Execution Timeouts (Security)
- [ ] **C++ Update:** In `Compiler/executeCpp.js`, prepend `timeout 15s ` to the runtime execution segment of the container bash script (similar to how `executeJava.js` does it).
- [ ] **C Update:** Do the same for `Compiler/executeC.js`.

---

## 🟡 P2 - Code Quality & Infrastructure (Should Address)

### 10. Refactor to OOP / Service Architecture
- [ ] **Service Layer Extraction:** Create a `services/` directory in the server. Extract business logic (e.g., checking test cases, interacting with DB) out of `controllers/problem.js` into a `ProblemService` class.
- [ ] **Controller Cleanup:** Ensure controllers only handle HTTP request parsing, calling the relevant Service methods, and formatting the HTTP response.

### 11. Clean Up Dead/Duplicate Code
- [ ] **Delete Unused Files:** Remove `server/controllers/problemExecution.js` if it is truly unrouted legacy code.
- [ ] **Consolidate User Controllers:** Merge `userProfileController.js`, `userStatsController.js`, and `userSubmissionsController.js` into a single, cohesive `UserService` and `user.js` controller.

### 12. Complete Docker Configuration
- [ ] **Add `docker-compose.yml`:** Create a root-level compose file orchestrating MongoDB, Redis (for queuing/caching), the Express backend, the Compiler microservice, and the Nginx frontend.

### 13. Optimize MongoDB Connection
- [ ] **Connection Pooling:** In `server/index.js`, update `mongoose.connect(process.env.MONGODB_URI)` to include `{ maxPoolSize: 50, wtimeoutMS: 2500 }` to handle concurrent scale as specified in the NFRs.
