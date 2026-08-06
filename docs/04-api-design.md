# Atlas REST API Architecture & Interface Specification
**Document Version:** 1.0.0  
**Status:** Approved Technical Standard  
**Author:** Office of the CTO & Lead API Architect  
**Base URL:** `https://api.atlasapp.com/v1`  
**Protocol:** HTTPS / TLS 1.3  

---

## 1. Executive Architectural Principles

The **Atlas API** provides a secure, predictable, low-latency interface connecting Web POS, KDS screens, Waiter mobile apps, QR ordering PWA, third-party aggregators (Swiggy/Zomato/ONDC), and the AI Business Brain.

```mermaid
graph TD
    subgraph Clients
        POS[Web POS Terminal]
        KDS[Kitchen Display Screen]
        QR[Diner QR PWA]
        Mobile[Waiter Mobile App]
        Agg[Swiggy / Zomato Webhooks]
    end

    subgraph API Gateway Layer
        WAF[Cloudflare WAF / Rate Limiter]
        GW[NestJS API Gateway / TLS 1.3]
        Auth[JWT Guards & Tenant Resolver]
    end

    subgraph Core Services
        AuthSvc[Auth & Role Service]
        OrderSvc[Order Processing Engine]
        KDSSvc[Realtime Socket Engine]
        StockSvc[Recipe & Stock Ledger]
        AISvc[AI Brain Engine]
    end

    Clients --> WAF --> GW --> Auth
    Auth --> AuthSvc & OrderSvc & KDSSvc & StockSvc & AISvc
```

### Core API Standards:
1. **RESTful Architecture**: Resources represented as plural nouns with standard HTTP verbs (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
2. **Predictable JSON Envelopes**: All response payloads adhere to unified success and error schemas.
3. **Strict Multi-Tenant Scoping**: All tenant requests MUST be scoped via authenticated JWT claims or context headers (`x-tenant-id`, `x-branch-id`).
4. **Idempotency Execution**: All mutating financial and order operations require an `Idempotency-Key` header.
5. **Sub-150ms Response SLA**: Target 95th percentile API response time under 150ms.

---

## 2. Global API Conventions

### 2.1. Base URL & Versioning
- **Production Base URL**: `https://api.atlasapp.com/v1`
- **Sandbox Base URL**: `https://sandbox-api.atlasapp.com/v1`
- **Versioning Strategy**: Major versions enforced in the URL path (`/v1/`). Non-breaking changes (new optional fields) are released transparently. Sunsetted endpoints provide standard deprecation headers:
  - `Sunset: Wed, 31 Dec 2026 23:59:59 GMT`
  - `Deprecation: @1798761599`

### 2.2. Standard Request Headers
```http
Authorization: Bearer <jwt_access_token>
Content-Type: application/json
Accept: application/json
x-tenant-id: 018e3a2b-7c4d-7123-89ab-112233445566
x-branch-id: 018e3a2b-7c4d-7456-89ab-998877665544
Idempotency-Key: 7f89b3a1-2c4d-4e5f-9a1b-3c4d5e6f7a8b
```

---

## 3. Standard Request & Response Envelopes

### 3.1. Unified Success Envelope
All successful API responses return an HTTP `200 OK` or `201 Created` status with the following structure:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resource retrieved successfully",
  "data": {},
  "meta": {
    "requestId": "req_01HJ89A1B2C3D4E5F6",
    "timestamp": "2026-07-31T12:00:00.000Z"
  }
}
```

### 3.2. Paginated Success Envelope (`GET` List Resources)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Orders retrieved successfully",
  "data": [],
  "meta": {
    "requestId": "req_01HJ89A1B2C3D4E5F6",
    "timestamp": "2026-07-31T12:00:00.000Z",
    "pagination": {
      "totalRecords": 1250,
      "page": 1,
      "limit": 20,
      "totalPages": 63,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 3.3. Standard RFC 7807 Error Envelope
Errors return appropriate 4xx/5xx HTTP status codes with structured diagnostic error details:

```json
{
  "success": false,
  "statusCode": 422,
  "errorCode": "VAL_INVALID_PAYLOAD",
  "message": "Validation failed for order creation payload",
  "error": "Unprocessable Entity",
  "details": [
    {
      "field": "items[0].quantity",
      "issue": "Quantity must be a positive integer greater than 0"
    }
  ],
  "meta": {
    "requestId": "req_01HJ89ERR998877",
    "timestamp": "2026-07-31T12:00:05.000Z"
  }
}
```

---

## 4. HTTP Status Code Matrix

| Status Code | Meaning | Usage Scenario in Atlas |
| :--- | :--- | :--- |
| **`200 OK`** | Request Succeeded | Successful `GET`, `PATCH`, or `PUT` resource update. |
| **`201 Created`** | Resource Created | Successful `POST` (e.g., Order created, User added). |
| **`204 No Content`** | Action Completed | Successful `DELETE` or non-body response. |
| **`400 Bad Request`** | Malformed Payload | Missing required headers or invalid JSON syntax. |
| **`401 Unauthorized`**| Invalid/Expired Token | Missing or expired JWT access token. |
| **`403 Forbidden`** | Insufficient RBAC | User lacks required permission scope. |
| **`404 Not Found`** | Resource Missing | Invalid `order_id`, `branch_id`, or endpoint URL. |
| **`409 Conflict`** | Resource State Conflict| Table already occupied or idempotency key replay conflict. |
| **`422 Unprocessable`**| Validation Failed | Business logic failure (e.g., item out of stock). |
| **`429 Too Many Requests`**| Rate Limited | Reached API request threshold per minute. |
| **`500 Internal Error`**| Unhandled Exception | Server-side bug; alert logged to monitoring system. |

---

## 5. Security, Rate Limiting & Idempotency

```mermaid
flowchart TD
    Req[Incoming Client Request] --> RateCheck{Rate Limit Exceeded?}
    RateCheck -- Yes --> R429[Return 429 Too Many Requests]
    RateCheck -- No --> IdemCheck{Has Idempotency-Key Header?}
    
    IdemCheck -- Yes --> CacheCheck{Key in Redis Cache?}
    CacheCheck -- Key Found --> ReturnCached[Return Cached Response]
    CacheCheck -- Key New --> Process[Execute Endpoint Logic]
    Process --> CacheSave[Save Response in Redis for 24h] --> ReturnFresh[Return Response]
    
    IdemCheck -- No --> Process
```

- **Rate Limiting Guidelines**:
  - Public Client APIs (QR Storefront): `100 requests / minute / IP`
  - Authenticated POS/KDS APIs: `1,000 requests / minute / User`
  - Partner Webhooks: `3,000 requests / minute / Merchant`
- **Idempotency Rules**:
  - Mandatory for: `POST /v1/orders`, `POST /v1/invoices/:id/payments`, `POST /v1/inventory/adjustments`.
  - Stored in Redis with key `idempotency:<tenant_id>:<key>` for **24 hours**.

---

## 6. Comprehensive API Endpoint Catalog

```mermaid
mindmap
  root((Atlas REST API))
    Auth & Identity
      POST /v1/auth/login
      POST /v1/auth/refresh
      POST /v1/auth/logout
    Catalog & Menus
      GET /v1/menu/items
      POST /v1/menu/items
      PATCH /v1/menu/items/:id/availability
    Orders Engine
      POST /v1/orders
      GET /v1/orders
      GET /v1/orders/:id
      PATCH /v1/orders/:id/status
    KDS Operations
      GET /v1/kds/tickets
      PATCH /v1/kds/tickets/:id/status
    Inventory Ledger
      GET /v1/inventory/stock
      POST /v1/inventory/adjustments
    AI Business Brain
      POST /v1/ai/query
      GET /v1/ai/forecast
```

### 6.1. Domain 1: Authentication & Session Management
- `POST /v1/auth/login` — Authenticate user via email/password or PIN code.
- `POST /v1/auth/refresh` — Issue new JWT access token using HTTP-Only refresh token.
- `POST /v1/auth/logout` — Invalidate current refresh token session.
- `POST /v1/auth/mfa/verify` — Verify 2FA OTP code.

### 6.2. Domain 2: Catalog & Menu Management
- `GET /v1/menu/categories` — List menu categories for active branch.
- `GET /v1/menu/items` — Fetch full menu catalog with prices and stock status.
- `POST /v1/menu/items` — Create new menu item (Admin/Manager).
- `PATCH /v1/menu/items/:id/availability` — Toggle item "86'd" out-of-stock state across channels.

### 6.3. Domain 3: Omnichannel Order Processing
- `POST /v1/orders` — Create new order (Dine-in, Takeaway, QR, Aggregator).
- `GET /v1/orders` — Search & list orders with filters (`status`, `channel`, `date_range`).
- `GET /v1/orders/:id` — Retrieve comprehensive order detail record.
- `PATCH /v1/orders/:id/status` — Transition order state (e.g., `CONFIRMED` -> `PREPARING`).
- `POST /v1/orders/:id/split` — Split order items into separate sub-bills.

### 6.4. Domain 4: Real-Time KDS & KOT Routing
- `GET /v1/kds/tickets` — Fetch active kitchen tickets for specific kitchen station.
- `PATCH /v1/kds/tickets/:id/status` — Update KOT station prep status (`IN_PREP` -> `COMPLETED`).
- `POST /v1/kds/tickets/:id/reprint` — Dispatch reprint trigger to physical ESC/POS printer.

### 6.5. Domain 5: Recipe & Inventory Ledger
- `GET /v1/inventory/stock` — Retrieve current raw ingredient stock levels.
- `POST /v1/inventory/adjustments` — Record manual stock adjustment (Spoilage, Audit).
- `POST /v1/inventory/purchase-orders` — Generate new vendor Purchase Order.

### 6.6. Domain 6: Billing & Payment Settlements
- `POST /v1/invoices` — Generate official tax invoice for completed order.
- `POST /v1/invoices/:id/payments` — Process payment settlement (Cash, Card, UPI, Stripe).

### 6.7. Domain 7: AI Business Brain
- `POST /v1/ai/query` — Execute conversational natural language query.
- `GET /v1/ai/forecast/demand` — Fetch predictive sales and prep volume forecast.

---

## 7. Concrete Request & Response Examples

### 7.1. Create Order (`POST /v1/orders`)

#### Request:
```http
POST /v1/orders HTTP/1.1
Host: api.atlasapp.com
Authorization: Bearer eyJhbGciOiJSUzI1Ni...
Content-Type: application/json
x-tenant-id: 018e3a2b-7c4d-7123-89ab-112233445566
x-branch-id: 018e3a2b-7c4d-7456-89ab-998877665544
Idempotency-Key: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d

{
  "channel": "DINE_IN",
  "tableId": "018e3a2b-7c4d-7890-89ab-111122223333",
  "waiterId": "018e3a2b-7c4d-7111-89ab-444455556666",
  "items": [
    {
      "menuItemId": "018e3a2b-7c4d-7222-89ab-777788889999",
      "quantity": 2,
      "notes": "Extra spicy, no butter"
    },
    {
      "menuItemId": "018e3a2b-7c4d-7333-89ab-000011112222",
      "quantity": 1,
      "notes": "Less ice"
    }
  ]
}
```

#### Response (`201 Created`):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Order created and dispatched to KDS",
  "data": {
    "orderId": "018e3a2b-7c4d-7999-89ab-333344445555",
    "orderNumber": "ORD-20260731-0042",
    "channel": "DINE_IN",
    "status": "CONFIRMED",
    "tableNumber": "T-04",
    "subtotal": 650.00,
    "taxAmount": 32.50,
    "totalAmount": 682.50,
    "kotTickets": [
      {
        "kotId": "018e3a2b-7c4d-8000-89ab-555566667777",
        "kotNumber": "KOT-0089",
        "station": "MAIN_KITCHEN",
        "status": "NEW"
      }
    ],
    "created_at": "2026-07-31T12:15:00.000Z"
  },
  "meta": {
    "requestId": "req_01HJ89POSTORD42",
    "timestamp": "2026-07-31T12:15:00.105Z"
  }
}
```

---

### 7.2. Execute AI Conversational Query (`POST /v1/ai/query`)

#### Request:
```http
POST /v1/ai/query HTTP/1.1
Host: api.atlasapp.com
Authorization: Bearer eyJhbGciOiJSUzI1Ni...
Content-Type: application/json
x-tenant-id: 018e3a2b-7c4d-7123-89ab-112233445566

{
  "prompt": "What was my highest margin dish this week at the Indiranagar branch?"
}
```

#### Response (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "AI query processed successfully",
  "data": {
    "answer": "Your highest margin dish at Indiranagar this week was **Paneer Butter Masala** with a gross margin of **74.2%** (Selling Price: ₹380, Theoretical Ingredient Cost: ₹98.04), generating ₹42,560 total gross profit across 112 orders.",
    "insights": [
      "Ingredient cost for Dairy increased by 2.1% compared to last week.",
      "Recommended action: Feature Paneer Butter Masala at the top of digital QR menus to drive upsells."
    ],
    "visualization": {
      "chartType": "BAR",
      "series": [
        { "item": "Paneer Butter Masala", "marginPercentage": 74.2 },
        { "item": "Cold Coffee", "marginPercentage": 71.8 },
        { "item": "Chicken Tikka", "marginPercentage": 64.5 }
      ]
    }
  },
  "meta": {
    "requestId": "req_01HJ89AIQUERY88",
    "timestamp": "2026-07-31T12:16:30.450Z"
  }
}
```

---

## 8. Webhook Architecture & Security Standards

Atlas ingests and dispatches real-time webhooks with external platforms (Swiggy, Zomato, Razorpay, WhatsApp).

```mermaid
sequenceDiagram
    autonumber
    participant Partner as External Partner (e.g. Swiggy)
    participant Gateway as Atlas Webhook Gateway
    participant RedisQueue as BullMQ Redis Queue
    participant Worker as Background Webhook Worker
    
    Partner->>Gateway: POST /v1/webhooks/swiggy with X-Atlas-Signature
    Gateway->>Gateway: Verify HMAC-SHA256 signature
    alt Signature Invalid
        Gateway-->>Partner: 401 Unauthorized (Reject)
    else Signature Valid
        Gateway->>RedisQueue: Push payload to queue
        Gateway-->>Partner: 202 Accepted (Sub-50ms ack)
        RedisQueue->>Worker: Process order ingestion asynchronously
    end
```

### Webhook Security Requirements:
1. **HMAC-SHA256 Signature Verification**: Every incoming webhook must include a signature header calculated using the tenant's shared secret:
   ```http
   X-Atlas-Signature: t=1753963200,v1=9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
   ```
2. **Asynchronous Ingestion**: Webhook controllers validate signatures and return HTTP `202 Accepted` immediately within 50ms, offloading heavy processing to **BullMQ / Redis queues**.
3. **Retry & Backoff Policy**: Failed outbound webhooks are retried automatically up to **5 times** using exponential backoff (Intervals: 1m, 5m, 15m, 1h, 6h).