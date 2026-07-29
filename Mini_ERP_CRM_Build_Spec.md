# Mini ERP + CRM Operations Portal — Build Specification

> **Purpose of this document:** This is a complete, self-contained requirements spec for an AI coding assistant (Cursor, Antigravity, etc.) to scaffold and build this project end-to-end. It consolidates the official case study PDF requirements into an unambiguous build plan. Follow it module by module, committing after each working module.

---

## 1. Project Overview

Build a **Mini ERP/CRM Operations Portal** for a wholesale/distribution company. Internal employees (Sales, Warehouse, Accounts, Admin) will use it to manage customers, products, stock, sales challans, and CRM follow-ups.

This is a case study submission — prioritize **correctness of business logic, clean REST API design, and a working deployed demo** over visual polish or scope creep.

**Deadline context:** ~26 hours from assignment. Build lean. Do not attempt bonus features (Docker, GitHub Actions, PDF export, S3 upload) unless all core modules are complete and deployed.

---

## 2. Required Tech Stack

### Backend
- Node.js + TypeScript
- Express.js **or** NestJS (Express recommended for speed unless already comfortable with Nest)
- PostgreSQL **or** MySQL (use PostgreSQL — free-tier hosting is more available, e.g. Neon, Render Postgres, Supabase)
- ORM: Prisma or Sequelize (Prisma recommended for speed + type safety)
- REST APIs only (no GraphQL)
- Input validation (e.g. `zod` or `express-validator`) and centralized error handling middleware

### Frontend
- React + TypeScript
- Plain CSS or a lightweight utility framework (Tailwind is fine) — keep it clean and admin-style, not fancy
- Responsive layout (usable on tablet/desktop at minimum)

### Deployment / DevOps
- Backend: Render, Railway, or Fly.io (free tier)
- Frontend: Vercel, Netlify, or Render Static Site
- Database: Neon, Supabase, or Render Postgres
- AWS deployment is a **bonus only** — do not attempt unless everything else is done and deployed on free-tier alternatives first
- Use environment variables for all secrets/config (DB connection string, JWT secret, PORT, etc.) — never hardcode
- GitHub repo with **real incremental commits** (not one giant commit at the end)

---

## 3. Core Modules

### Module 1 — Authentication & Roles

- JWT-based login (`POST /auth/login`)
- Four roles: **Admin, Sales, Warehouse, Accounts**
- Role-based access control middleware on protected routes
- Seed script or setup instructions to create one test user per role
- Suggested minimal user model: `id, name, email, passwordHash, role, createdAt`

**Suggested role permissions (make a reasonable assumption, document it in README):**
| Action | Admin | Sales | Warehouse | Accounts |
|---|---|---|---|---|
| Manage customers | ✅ | ✅ | ❌ | ❌ |
| Manage products/stock | ✅ | ❌ | ✅ | ❌ |
| Create/confirm challans | ✅ | ✅ | ❌ | ❌ |
| View reports/invoices | ✅ | ❌ | ❌ | ✅ |

---

### Module 2 — Customer CRM

**Customer fields:**
- `name` (required)
- `mobileNumber` (required)
- `email`
- `businessName`
- `gstNumber` (optional)
- `customerType`: enum — `Retail`, `Wholesale`, `Distributor`
- `address`
- `status`: enum — `Lead`, `Active`, `Inactive`
- `followUpDate`
- `notes` (free text or a related `follow_up_notes` table for multiple timestamped entries — prefer the latter, it's more realistic)

**Required features:**
- Add customer
- Edit customer
- Search customer (by name/mobile/business name at minimum)
- View customer detail page
- Add follow-up notes (timestamped, multiple per customer)

**Suggested endpoints:**
```
POST   /customers
GET    /customers          (supports ?search= & pagination)
GET    /customers/:id
PUT    /customers/:id
POST   /customers/:id/notes
```

---

### Module 3 — Product & Inventory

**Product fields:**
- `name` (required)
- `sku` (unique, required)
- `category`
- `unitPrice`
- `currentStock`
- `minStockAlert` (quantity threshold)
- `location` / `warehouse`

**Required features:**
- Add product
- Edit product
- **Stock movement log** — every stock change must create a log entry:
  - `productId`
  - `quantityChanged`
  - `movementType`: `IN` or `OUT`
  - `reason` (e.g. "Purchase Order #123", "Challan #456", "Manual adjustment")
  - `createdBy` (user id)
  - `timestamp`

> Stock levels should **never** be edited directly — all changes go through movement log entries so `currentStock` is always derived/consistent with the log.

**Suggested endpoints:**
```
POST   /products
GET    /products            (supports ?search=, ?lowStock=true, pagination)
GET    /products/:id
PUT    /products/:id
POST   /products/:id/stock-movement
GET    /products/:id/stock-movements
```

---

### Module 4 — Sales Challan

This is the most business-logic-heavy module — **prioritize getting this right**.

**Flow:**
1. Sales user selects a customer
2. Adds multiple products with quantities
3. Challan number auto-generated (e.g. `CH-2026-0001`, sequential or timestamp-based — document your scheme)
4. Save as **Draft** or **Confirmed**

**Critical business rules:**
- Draft challans do **not** affect stock
- On **Confirm**: stock must reduce for each line item
- Stock must **never go negative** — if any line item has insufficient stock, reject the **entire** confirm operation with a clear error (don't partially confirm)
- Each stock reduction on confirm must also create a `Stock Movement` log entry (`OUT`, reason = challan number)
- Challan line items must store a **snapshot** of product data at time of creation (name, SKU, price) — not just a foreign key — so historical challans remain accurate even if the product is later edited/renamed

**Challan fields:**
- `challanNumber` (auto-generated, unique)
- `customerId`
- `lineItems[]`: each with `productId`, `productNameSnapshot`, `skuSnapshot`, `unitPriceSnapshot`, `quantity`
- `totalQuantity`
- `status`: `Draft`, `Confirmed`, `Cancelled`
- `createdBy`
- `createdDate`

**Suggested endpoints:**
```
POST   /challans                  (create as Draft)
GET    /challans                  (list, filter by status/customer, pagination)
GET    /challans/:id
PUT    /challans/:id               (edit while Draft)
POST   /challans/:id/confirm       (runs stock validation + reduction)
POST   /challans/:id/cancel
```

**Error case to explicitly handle:**
```
POST /challans/:id/confirm
→ if any line item quantity > product.currentStock:
   return 400 with { error: "Insufficient stock for <product name>. Available: X, Requested: Y" }
   and do NOT confirm any part of the challan
```

---

## 4. General API Requirements

- Clean REST conventions (`GET /customers`, `POST /customers`, etc. — see examples above)
- Input validation on every write endpoint (400 with clear message on invalid input)
- Proper HTTP status codes (200/201/400/401/403/404/500 used correctly)
- Pagination on all list endpoints (`?page=&limit=`)
- Search/filter support where noted above
- Consistent error response shape, e.g.:
```json
{ "error": "message", "details": [ ... ] }
```

---

## 5. Frontend Requirements

- Clean **admin-style UI** — sidebar/topnav + content area is sufficient, no need for elaborate design
- Pages needed:
  - Login
  - Customer list + detail/edit + add-note
  - Product list + add/edit + stock movement view
  - Challan create flow (select customer → add products → save draft/confirm)
  - Challan list + detail view
- Role-aware navigation (hide/disable actions the logged-in role can't perform)
- Responsive enough to be usable on a laptop screen at minimum

---

## 6. Deployment Requirements

- Deploy backend + frontend + database on free-tier services (see stack section)
- Document in README:
  - How the server was set up
  - How environment variables are managed (list required env vars, e.g. `DATABASE_URL`, `JWT_SECRET`, `PORT`, `FRONTEND_URL`)
  - How to run the project locally (step-by-step)
  - How to deploy the project (step-by-step)
  - Any assumptions made (e.g. role-permission matrix, challan numbering scheme)

---

## 7. Submission Checklist

- [ ] GitHub repository link (with incremental commit history)
- [ ] Live frontend URL
- [ ] Live backend API URL
- [ ] Test login credentials for **all 4 roles**
- [ ] Postman collection (or equivalent API docs)
- [ ] README covering setup, env vars, local run, deployment, assumptions
- [ ] Short architecture explanation (in README or separate doc)
- [ ] Known limitations / incomplete parts (be honest — this is expected and graded fairly)
- [ ] **Mandatory screen recording** of the build/approach process (separate requirement from the case study PDF — required by the recruiter email, not optional)

---

## 8. Explicitly Out of Scope (unless time remains after all above is done)

- Docker setup
- GitHub Actions CI/CD
- Invoice PDF export
- Product image upload to AWS S3
- AWS deployment (bonus only, free-tier alternatives are equally acceptable)

---

## 9. Build Order Recommendation (for the AI assistant)

1. Scaffold backend (Express + TS + Prisma + Postgres), connect to a free-tier DB, deploy a "health check" endpoint immediately
2. Scaffold frontend (React + TS), deploy a blank shell immediately — get the deploy pipeline working before building features
3. Auth module (JWT + roles + seed users) — everything else depends on this
4. Customer CRM module (simplest CRUD, quick win)
5. Product & Inventory module (CRUD + stock movement log)
6. Sales Challan module (most complex — save adequate time for stock-validation logic)
7. Wire up frontend pages against working backend, module by module
8. Write README, export Postman collection, do final commit pass
9. Record screen walkthrough of the working system
