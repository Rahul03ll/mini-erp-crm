# Mini ERP/CRM Operations Portal

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A full-stack wholesale/distribution operations portal for managing customers, products, inventory, sales challans, and CRM follow-ups.

> 🚀 **Live Demo:** [https://mini-erp-crm-omega.vercel.app](https://mini-erp-crm-omega.vercel.app)

## Live URLs

| Service  | URL |
|----------|-----|
| Frontend | https://mini-erp-crm-omega.vercel.app |
| Backend  | https://mini-erp-crm-backend-cklw.onrender.com |

## Tech Stack

- **Backend:** Node.js, TypeScript, Express, Prisma, PostgreSQL, Zod, JWT
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router
- **Database:** PostgreSQL (Neon, Supabase, or Render Postgres recommended)

## Architecture

```
┌─────────────┐     REST/JSON      ┌──────────────┐     Prisma     ┌────────────┐
│  React SPA  │ ◄──────────────► │  Express API │ ◄────────────► │ PostgreSQL │
│  (Vite)     │   JWT Auth       │  + Zod       │                │            │
└─────────────┘                  └──────────────┘                └────────────┘
```

**Modules:**
1. **Auth** — JWT login, 4 roles (Admin, Sales, Warehouse, Accounts)
2. **Customer CRM** — CRUD, search, timestamped follow-up notes
3. **Product & Inventory** — CRUD, stock movement log (IN/OUT), low-stock filter
4. **Sales Challan** — Draft → Confirm flow with atomic stock validation & reduction
5. **Invoice Export** — PDF invoice generation for confirmed challans

## Role Permissions

| Action | Admin | Sales | Warehouse | Accounts |
|--------|-------|-------|-----------|----------|
| Manage customers | ✅ | ✅ | ❌ | ❌ |
| Manage products/stock | ✅ | ❌ | ✅ | ❌ |
| Create/confirm challans | ✅ | ✅ | ❌ | ❌ |
| View reports/invoices | ✅ | ❌ | ❌ | ✅ |

**Additional assumptions:**
- Sales users can only view challans they created; Admin and Accounts see all.
- Confirmed challans cannot be cancelled (stock already deducted).
- Challan numbering: `CH-{YEAR}-{0001}` sequential per year (e.g. `CH-2026-0001`).

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@erp.com | admin123 |
| Sales | sales@erp.com | sales123 |
| Warehouse | warehouse@erp.com | warehouse123 |
| Accounts | accounts@erp.com | accounts123 |

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | Token expiry (default: `24h`) |
| `PORT` | Server port (default: `3001`) |
| `FRONTEND_URL` | Frontend origin for CORS |
| `NODE_ENV` | `development` or `production` |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL (e.g. `http://localhost:3001`) |

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or free-tier cloud)

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

npm install
npx prisma db push
npm run db:seed
npm run dev
```

Backend runs at `http://localhost:3001`. Health check: `GET /health`

### 2. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:3001

npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

## Deployment

### Database (Neon — recommended free tier)

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string → use as `DATABASE_URL`

### Backend (Render)

1. Push repo to GitHub
2. Create a **Web Service** on [render.com](https://render.com)
3. Root directory: `backend`
4. Build command: `npm install && npx prisma generate && npm run build`
5. Start command: `npx prisma db push && npm run db:seed && npm start`
6. Set env vars: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`

Alternatively, use the included `backend/render.yaml` Blueprint.

### Frontend (Vercel)

1. Import repo on [vercel.com](https://vercel.com)
2. Root directory: `frontend`
3. Set env var: `VITE_API_URL=https://your-backend.onrender.com`
4. Deploy

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/auth/login` | Login |
| GET/POST | `/customers` | List / Create customers |
| GET/PUT | `/customers/:id` | Get / Update customer |
| POST | `/customers/:id/notes` | Add follow-up note |
| GET/POST | `/products` | List / Create products |
| GET/PUT | `/products/:id` | Get / Update product |
| POST | `/products/:id/stock-movement` | Record stock IN/OUT |
| GET | `/products/:id/stock-movements` | Stock movement log |
| GET/POST | `/challans` | List / Create challan (Draft) |
| GET/PUT | `/challans/:id` | Get / Update draft challan |
| POST | `/challans/:id/confirm` | Confirm & deduct stock |
| POST | `/challans/:id/cancel` | Cancel draft challan |
| GET | `/challans/:id/invoice` | Download invoice PDF (confirmed challans only) |

All endpoints except `/health` and `/auth/login` require `Authorization: Bearer <token>`.

Import the Postman collection from `postman/Mini_ERP_CRM.postman_collection.json`.

## Known Limitations

- ~~No PDF invoice export (out of scope)~~ **✅ Now available!**
- No product image upload
- No Docker/CI-CD setup
- Sales users scoped to their own challans only
- Confirmed challans cannot be reversed/cancelled
- Pagination max 100 items per page

## Project Structure

```
casestudy/
├── backend/
│   ├── prisma/schema.prisma    # Database schema
│   ├── prisma/seed.ts          # Seed users & sample data
│   ├── src/
│   │   ├── routes/             # API route handlers
│   │   ├── middleware/         # Auth, validation, errors
│   │   ├── lib/                # Utilities (Prisma, PDF generator)
│   │   └── index.ts            # Express app entry
│   └── render.yaml             # Render deployment config
├── frontend/
│   └── src/
│       ├── pages/              # React page components
│       ├── components/         # Layout, auth guard
│       ├── api/client.ts       # API client
│       └── context/            # Auth context
├── postman/                    # Postman collection
├── .github/                    # GitHub templates
├── CONTRIBUTING.md             # Contribution guidelines
├── CHANGELOG.md                # Version history
├── LICENSE                     # MIT License
├── TEST_REPORT.md              # Test results
├── PROJECT_SUMMARY.md          # Quick reference
└── README.md                   # This file
```

## 📄 Documentation

- **[API Documentation](postman/Mini_ERP_CRM.postman_collection.json)** - Postman collection
- **[Test Report](TEST_REPORT.md)** - Comprehensive test results
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute
- **[Changelog](CHANGELOG.md)** - Version history
- **[Project Summary](PROJECT_SUMMARY.md)** - Quick reference

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Rahul03ll**
- GitHub: [@Rahul03ll](https://github.com/Rahul03ll)

## 🙏 Acknowledgments

- Built as a case study project for wholesale/distribution operations
- Uses modern web technologies and best practices
- Deployed on free-tier cloud services (Render, Vercel, Neon)
