# 📖 Project Atlas — Production Operations Runbook

**Version**: 1.0.0 (Sprint 3.65)  
**Platform**: Project Atlas Multi-Tenant Restaurant OS  
**Target Environment**: Docker Swarm / Kubernetes / Cloud VPS (PostgreSQL 16 + Redis 7 + NestJS + Next.js 16)

---

## 1. 🚀 Deployment & Health Verification

### 1.1 Standard Zero-Downtime Deployment
```bash
# 1. Pull latest verified release
git pull origin main

# 2. Build production artifacts
pnpm build

# 3. Synchronize database schema safely
pnpm --filter api prisma:deploy

# 4. Spin up containerized production stack
docker-compose up -d --build
```

### 1.2 Automated Health Probes
```bash
# Liveness Probe (Should return 200 OK)
curl -i http://localhost:3000/api/health/live

# Deep Readiness Probe (Verifies PostgreSQL & Redis ping)
curl -i http://localhost:3000/api/health/ready
```

---

## 2. 💾 Disaster Recovery & Database Restoration

### 2.1 Automated Snapshot Backup
Atlas includes an automated relational snapshot engine that captures all 13 core entities (Users, Tenants, Restaurants, Branches, Tables, Menus, Orders, Payments, Subscriptions) and verifies 100% foreign key integrity:
```bash
pnpm db:backup
```
Snapshots are archived as timestamped JSON payloads under `./backups/atlas-backup-YYYY-MM-DD-*.json`.

### 2.2 Cold-Restore Procedure
In the event of database corruption:
```bash
# 1. Stop write traffic
docker-compose stop api

# 2. Restore snapshot into fresh PostgreSQL database
node --env-file=apps/api/.env scripts/backup-and-restore.mjs --restore ./backups/atlas-backup-<TIMESTAMP>.json

# 3. Verify record counts & integrity
pnpm test:security

# 4. Resume API traffic
docker-compose start api
```

---

## 3. 🧠 Redis Failover & Cache Recovery

### 3.1 Redis Outage Behavior
Project Atlas uses an active-fallback in-memory cache resilience layer. If Redis becomes unavailable:
1. `RedisService` catches disconnection events and suppresses crashes.
2. Analytics and session lookups degrade seamlessly to direct PostgreSQL queries with 100% data fidelity.
3. System telemetry logs a `WARN` alert while continuing to process orders.

### 3.2 Redis Restart & Flusher
```bash
# Restart Redis container
docker-compose restart redis

# Flush cache manually if cache invalidation is required
docker exec -it atlas-redis redis-cli FLUSHALL
```

---

## 4. 🚨 Incident Classification & SLA Matrix

| Priority | Definition | Example Scenario | SLA Target | Action Required |
|:---:|---|---|:---:|---|
| **P0 — Critical** | Platform is completely inaccessible or order pipeline is halted | Orders failing to reach Kitchen KDS; Database down | **< 15 Mins** | Page on-call engineer, trigger rollback or switch to standby DB |
| **P1 — Major** | Core feature degraded with no immediate workaround | Payment settlement failing; Table QR generator down | **< 1 Hour** | Investigate logs at `/api/monitoring/metrics`, deploy hotfix |
| **P2 — Normal** | Non-blocking bug or partial UI issue | Analytics chart rendering delay; Filter glitch | **< 24 Hours** | Track in Support Desk, schedule patch in next release |
| **P3 — Minor** | Minor cosmetic glitch or feature suggestion | Typography alignment; Extra button padding | **Next Sprint** | Log in backlog |

---

## 5. 🆘 Support Incident Escalation
When a restaurant files a support ticket:
1. A unique incident code is assigned (e.g. `ATLAS-8F29`).
2. Platform Admins inspect the queue under **Atlas Platform Control Center > 🆘 Support Desk**.
3. Admins review stack traces, add resolution notes, and notify the restaurant owner directly.
