# 🏢 Mini ERP/CRM Operations Portal

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18%2F19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.3-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Frontend](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel&logoColor=white)](https://mini-erp-crm-omega.vercel.app)
[![Backend](https://img.shields.io/badge/Deployed-Render-46E3B7?logo=render&logoColor=white)](https://mini-erp-crm-backend-cklw.onrender.com)
[![CI Workflow](https://github.com/Rahul03ll/mini-erp-crm/actions/workflows/ci.yml/badge.svg)](https://github.com/Rahul03ll/mini-erp-crm/actions/workflows/ci.yml)

A production-grade, full-stack wholesale and distribution operations portal engineered for managing business-to-business inventory pipelines, customer account management, delivery challan lifecycles with atomic stock validation, and PDF invoice generation backed by strict Role-Based Access Control (RBAC).

---

## 🌐 Live Deployments

| Component | Cloud Platform | Live Link | Status |
|---|---|---|---|
| **Frontend Web App** | **Vercel** | [https://mini-erp-crm-omega.vercel.app](https://mini-erp-crm-omega.vercel.app) | ![Status](https://img.shields.io/badge/Status-Live-success?style=flat-square) |
| **Backend REST API** | **Render** | [https://mini-erp-crm-backend-cklw.onrender.com](https://mini-erp-crm-backend-cklw.onrender.com) | ![Status](https://img.shields.io/badge/Status-Live-success?style=flat-square) |
| **Database Engine** | **Neon PostgreSQL** | Serverless Cloud PostgreSQL | ![Status](https://img.shields.io/badge/Status-Connected-blue?style=flat-square) |

> 💡 **Tip**: When testing the backend on Render's free tier, the first request may take a few seconds while the container spins up from idle.

---

## 🔑 Demo & Test Credentials

The database comes pre-seeded with four role accounts to test the Role-Based Access Control (RBAC) boundaries:

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Admin** | `admin@erp.com` | `admin123` | Full administrative access across all modules, products, users, challans & reports |
| **Sales** | `sales@erp.com` | `sales123` | Manage CRM customers, draft sales challans, view & confirm own challans |
| **Warehouse** | `warehouse@erp.com` | `warehouse123` | Product catalog, inventory stock movements (IN/OUT log), low stock monitors |
| **Accounts** | `accounts@erp.com` | `accounts123` | View all confirmed sales challans, financial reports, and download PDF invoices |

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT TIER (Vite SPA)                           │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ React 18/19 SPA  •  Tailwind CSS  •  React Router 7  •  Auth Context  │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │ HTTPS / REST (JWT Bearer Auth)
┌─────────────────────────────────────▼───────────────────────────────────────┐
│                           API TIER (Node.js & Express)                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Express 4.x Router                                                    │  │
│  │  ├── CORS Middleware (Configurable Frontend Origin Whitelist)         │  │
│  │  ├── JWT Authentication & Permission Guard Middleware                 │  │
│  │  ├── Zod Schema Validators (Strong Request Contract Safety)           │  │
│  │  └── PDFKit Streaming Engine (On-demand PDF Invoice Generation)       │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │ Prisma Client Connection Pool
┌─────────────────────────────────────▼───────────────────────────────────────┐
│                          DATA TIER (PostgreSQL)                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Neon / Serverless PostgreSQL 16                                       │  │
│  │  ├── Users & Roles (Admin, Sales, Warehouse, Accounts)                │  │
│  │  ├── Customers & Timestamped Follow-up Notes                          │  │
│  │  ├── Products & StockMovement Audit Logs                              │  │
│  │  └── Challans (Draft/Confirmed/Cancelled) & Immutable Line Snapshots  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Challan & Stock Lifecycle Workflow

```
 ┌─────────────┐
 │ Sales User  │ ──► Creates Challan (Draft)
 └─────────────┘         │
                         ▼
             [Line Items Snapshot]
             (Freezes Product Name, SKU, & Unit Price at creation)
                         │
                         ▼
               ┌───────────────────┐
               │    Draft State    │ ◄── Allowed to edit line items or cancel
               └─────────┬─────────┘
                         │
                 Confirm Request
                         │
                         ▼
             ┌───────────────────────┐
             │ Atomic DB Transaction │
             │  1. Check stock >= req│
             │  2. Throw if deficient│
             │  3. Decrement stock   │
             │  4. Log StockMovement │
             │  5. Mark Confirmed    │
             └───────────┬───────────┘
                         │
                         ▼
               ┌───────────────────┐
               │  Confirmed State  │ (Stock deducted, irreversible)
               └─────────┬─────────┘
                         │
                         ▼
             ┌───────────────────────┐
             │ PDF Invoice Generator │ ──► Downloads professional PDF invoice
             └───────────────────────┘
```

---

## ⚡ Key Modules & Capabilities

### 1. 🔐 Authentication & Role-Based Access Control (RBAC)
- Stateless JWT authentication with configurable expiration (`24h` default).
- Secure password hashing with `bcryptjs`.
- Four fine-grained permission roles (`Admin`, `Sales`, `Warehouse`, `Accounts`).
- Client-side route protection & server-side authorization middleware (`authorize('permission_name')`).

### 2. 👥 Customer Relationship Management (CRM)
- Complete customer CRUD with business name, GST number, contact details, and address.
- Timestamped follow-up note logging attributed to specific team members.
- Dynamic search across customer names, business names, and mobile numbers.

### 3. 📦 Product Catalog & Warehouse Inventory Management
- Product management with SKU uniqueness enforcement, category classification, and location tagging.
- **Audit-compliant Stock Control**: Product stock cannot be arbitrarily overwritten. Stock updates strictly occur via auditable `StockMovement` logs (`IN` / `OUT` with mandatory reason tracking).
- Real-time **Low Stock Filter** alerting when `currentStock <= minStockAlert`.

### 4. 📝 Sales Challan Operations
- Draft $\rightarrow$ Confirmed $\rightarrow$ Cancelled state machine.
- Automatic sequential challan numbering: `CH-{YYYY}-{####}`.
- **Snapshot Integrity**: Freezes product name, SKU, and unit price into `ChallanLineItem` at creation time, preserving historical billing integrity regardless of subsequent catalog changes.
- **Atomic Stock Validation**: Multi-item stock checks run in an isolated Prisma `$transaction`. If any item exceeds available stock, the entire transaction rolls back without deducting inventory.

### 5. 📑 PDF Invoice Generation (PDFKit)
- Confirmed challans instantly generate formatted PDF invoices with subtotal, tax calculation (10%), line item tables, and customer information.
- Streamed directly to client with automatic attachment download (`invoice-{challanNumber}.pdf`).
- Available to Admin, Accounts, and originating Sales representatives directly from Challan Details or the Reports dashboard.

---

## 🛡️ Role & Permissions Matrix

| Operational Action | Admin | Sales | Warehouse | Accounts |
|---|:---:|:---:|:---:|:---:|
| **Manage Customers (CRUD & Notes)** | ✅ | ✅ | ❌ | ❌ |
| **Manage Product Catalog & Stock IN/OUT** | ✅ | ❌ | ✅ | ❌ |
| **Create & Edit Draft Challans** | ✅ | ✅ | ❌ | ❌ |
| **Confirm Challans (Deduct Stock)** | ✅ | ✅ *(Own)* | ❌ | ❌ |
| **Cancel Draft Challans** | ✅ | ✅ *(Own)* | ❌ | ❌ |
| **View Confirmed Challans & Reports** | ✅ | ✅ *(Own)* | ❌ | ✅ *(All)* |
| **Export & Download PDF Invoices** | ✅ | ✅ *(Own)* | ❌ | ✅ *(All)* |

---

## 🛠️ Tech Stack Breakdown

### Frontend
- **Framework**: React 18 / 19 (Functional components & hooks)
- **Tooling & Bundler**: Vite 6
- **Routing**: React Router DOM 7
- **Styling**: Tailwind CSS 3.4 & PostCSS
- **Language**: TypeScript 5.7 (Strict mode)

### Backend
- **Runtime**: Node.js (LTS 20+)
- **Framework**: Express.js 4.21
- **Database ORM**: Prisma ORM 6.3
- **Validation**: Zod 3.24
- **Security & Auth**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
- **Document Generation**: PDFKit 0.19
- **CORS**: Dynamic whitelist with credential support

---

## 📁 Repository Structure

```
mini-erp-crm/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI (Node 20, v4 actions)
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # PostgreSQL Prisma data models
│   │   └── seed.ts              # Database seeder (Roles, users, catalog)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── pdfGenerator.ts  # PDFKit invoice streaming builder
│   │   │   └── prisma.ts        # Shared Prisma client instance
│   │   ├── middleware/
│   │   │   ├── auth.ts          # JWT authentication & RBAC guards
│   │   │   └── errorHandler.ts  # Zod validation & AppError handling
│   │   ├── routes/
│   │   │   ├── auth.ts          # /auth/login
│   │   │   ├── customers.ts     # /customers CRUD & follow-up notes
│   │   │   ├── products.ts      # /products catalog & stock movements
│   │   │   └── challans.ts      # /challans workflow & PDF invoice export
│   │   └── index.ts             # Express server bootstrap & middleware
│   ├── .env.example             # Backend environment template
│   ├── package.json             # Backend dependencies & scripts
│   ├── render.yaml              # Render blueprint deployment definition
│   └── tsconfig.json            # Strict TypeScript backend configuration
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts        # Typed fetch client with auth & invoice helper
│   │   ├── components/
│   │   │   ├── Layout.tsx       # Sidebar, topbar navigation & user badge
│   │   │   ├── ProtectedRoute.tsx # Route authentication check
│   │   │   └── PermissionRoute.tsx # RBAC route guard
│   │   ├── context/
│   │   │   └── AuthContext.tsx  # User session & credentials state
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx    # Role login portal
│   │   │   ├── CustomerListPage.tsx
│   │   │   ├── CustomerDetailPage.tsx
│   │   │   ├── CustomerFormPage.tsx
│   │   │   ├── ProductListPage.tsx
│   │   │   ├── ProductDetailPage.tsx
│   │   │   ├── ProductFormPage.tsx
│   │   │   ├── ChallanListPage.tsx
│   │   │   ├── ChallanDetailPage.tsx # Detail view with PDF invoice button
│   │   │   ├── ChallanFormPage.tsx
│   │   │   └── ReportsPage.tsx  # Financial metrics & invoice download table
│   │   ├── types/
│   │   │   └── index.ts         # Shared TypeScript interfaces
│   │   ├── App.tsx              # Router declarations
│   │   └── main.tsx             # React DOM entry
│   ├── .env.example             # Frontend environment template
│   ├── package.json             # Frontend dependencies & scripts
│   ├── tailwind.config.js       # Tailwind CSS configuration
│   ├── vite.config.ts           # Vite build & proxy settings
│   └── tsconfig.json            # Strict TypeScript frontend configuration
├── postman/
│   └── Mini_ERP_CRM.postman_collection.json # Complete API collection
├── .env.example                 # Monorepo root environment guide
├── .gitignore                   # Comprehensive ignores for build/logs/envs
├── CONTRIBUTING.md              # Guidelines for contributing
├── CHANGELOG.md                 # Project release history
├── LICENSE                      # MIT License
├── PROJECT_SUMMARY.md           # Quick specification reference
├── TEST_REPORT.md               # End-to-end verification report
└── README.md                    # Project documentation
```

---

## ⚙️ Environment Variables

### Root / Monorepo Overview (`.env.example`)
A consolidated template is provided at the project root for local multi-service development:

```ini
# Backend (backend/.env)
DATABASE_URL="postgresql://user:password@localhost:5432/mini_erp_crm?schema=public"
JWT_SECRET="change-this-to-a-long-random-secret-in-production"
JWT_EXPIRES_IN="24h"
PORT=3001
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"

# Frontend (frontend/.env)
VITE_API_URL="http://localhost:3001"
```

### Backend (`backend/.env`)

| Variable | Required | Description | Example |
|---|:---:|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection URI | `postgresql://user:pwd@host:5432/db?schema=public` |
| `JWT_SECRET` | Yes | Secret key used for signing JWTs | `super-secret-jwt-key` |
| `JWT_EXPIRES_IN`| No | Token lifespan (default: `24h`) | `24h` |
| `PORT` | No | Express HTTP listening port (default: `3001`) | `3001` |
| `FRONTEND_URL` | No | Allowed frontend origin for CORS | `http://localhost:5173` |
| `NODE_ENV` | No | Runtime environment (`development` / `production`)| `development` |

### Frontend (`frontend/.env`)

| Variable | Required | Description | Example |
|---|:---:|---|---|
| `VITE_API_URL` | Yes | Base URL for backend REST API | `http://localhost:3001` |

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js**: v18 or v20 LTS recommended
- **PostgreSQL**: Local instance, Docker container, or free serverless DB (Neon / Supabase)
- **npm** or **pnpm**

### Step 1: Clone Repository
```bash
git clone https://github.com/Rahul03ll/mini-erp-crm.git
cd mini-erp-crm
```

### Step 2: Backend Setup & Database Migration
```bash
cd backend

# Setup environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Install dependencies
npm ci

# Push database schema & seed initial accounts/products
npx prisma db push
npm run db:seed

# Start backend development server (with live reload)
npm run dev
```
> The backend server starts at **`http://localhost:3001`**. Health check: `GET http://localhost:3001/health`.

### Step 3: Frontend Setup
Open a new terminal window:
```bash
cd frontend

# Setup environment variables
cp .env.example .env

# Install dependencies
npm ci

# Start Vite development server
npm run dev
```
> The frontend application starts at **`http://localhost:5173`**.

---

## 📡 REST API Reference

All protected endpoints require an `Authorization: Bearer <token>` header obtained from `/auth/login`.

### Authentication
- `POST /auth/login` — Authenticate user and receive JWT + user profile.
- `GET /health` — Service health check and current server ISO timestamp.

### Customer Management (`/customers`)
- `GET /customers?page=1&limit=20&search=keyword` — Search and list customers (Paginated).
- `POST /customers` — Create a new customer record.
- `GET /customers/:id` — Get customer details and history of follow-up notes.
- `PUT /customers/:id` — Update customer information.
- `POST /customers/:id/notes` — Add timestamped follow-up note to customer profile.

### Inventory & Products (`/products`)
- `GET /products?page=1&limit=20&search=keyword&lowStock=true` — List products with optional low-stock filter.
- `POST /products` — Create a product in catalog (initial stock defaults to 0).
- `GET /products/:id` — Get product details.
- `PUT /products/:id` — Update product details (excluding stock count).
- `POST /products/:id/stock-movement` — Record audited stock transaction (`IN` / `OUT`) with mandatory reason.
- `GET /products/:id/stock-movements` — Fetch complete audit history for a product.

### Sales Challans & Invoices (`/challans`)
- `GET /challans?page=1&limit=20&status=Confirmed` — List challans (Sales role sees only own).
- `POST /challans` — Create a new challan in `Draft` state with frozen line snapshots.
- `GET /challans/:id` — Retrieve full challan with customer and snapshot details.
- `PUT /challans/:id` — Edit customer or line items (Allowed only in `Draft` state).
- `POST /challans/:id/confirm` — Validate stock atomically, deduct inventory, and confirm challan.
- `POST /challans/:id/cancel` — Cancel a draft challan (Cannot cancel once confirmed).
- `GET /challans/:id/invoice` — Stream formatted PDF invoice file (`application/pdf`).

---

## ☁️ Deployment Guide

### Database (Neon PostgreSQL)
1. Create a free PostgreSQL database at [neon.tech](https://neon.tech).
2. Copy the pooled connection string into `DATABASE_URL`.

### Backend (Render)
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository and set **Root Directory** to `backend`.
3. Build Command: `npm install && npx prisma generate && npm run build`
4. Start Command: `npx prisma db push && npm run db:seed && npm start`
5. Configure Environment Variables: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`.

### Frontend (Vercel)
1. Import repository on [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Configure Environment Variable: `VITE_API_URL=https://mini-erp-crm-backend-cklw.onrender.com`.
4. Deploy.

---

## 👨‍💻 Author & Contact

**Rahul Roy**  
*Final-Year B.Tech CSE Student, KIIT University, Bhubaneswar, India*

- **GitHub**: [@Rahul03ll](https://github.com/Rahul03ll)
- **LinkedIn**: [linkedin.com/in/rahul-roy-362a12256](https://linkedin.com/in/rahul-roy-362a12256)
- **Email**: [rahulroy2259@gmail.com](mailto:rahulroy2259@gmail.com)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
