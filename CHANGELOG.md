# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-07-29

### Added
- **Invoice PDF Export** - Generate and download professional PDF invoices for confirmed challans
- PDF generation using pdfkit library
- Download button on challan detail page for confirmed challans
- Professional invoice layout with company details, customer info, line items, and totals
- Comprehensive test report (TEST_REPORT.md)
- Project summary document (PROJECT_SUMMARY.md)

### Changed
- Updated README with Invoice PDF export feature
- Updated Known Limitations section

### Fixed
- TypeScript compilation issues in production build
- Dependencies moved to production for Render deployment

## [1.0.0] - 2026-07-29

### Initial Release

#### Features
- **Authentication & Roles**
  - JWT-based authentication
  - 4 user roles: Admin, Sales, Warehouse, Accounts
  - Role-based access control (RBAC)
  - Protected API routes

- **Customer CRM Module**
  - Full CRUD operations
  - Customer search by name/mobile/business
  - Timestamped follow-up notes
  - Pagination support
  - Customer types: Retail, Wholesale, Distributor

- **Product & Inventory Module**
  - Product CRUD operations
  - Stock movement logging (IN/OUT)
  - Automatic stock tracking
  - Low stock alerts
  - Search and pagination

- **Sales Challan Module**
  - Draft → Confirm workflow
  - Multi-line item support
  - Auto-generated challan numbers (CH-YYYY-####)
  - Atomic stock validation
  - No negative stock enforcement
  - Product data snapshots
  - Cancel draft functionality

#### Technical
- Backend: Node.js, TypeScript, Express, Prisma, PostgreSQL
- Frontend: React, TypeScript, Vite, Tailwind CSS
- Deployment: Render (backend), Vercel (frontend), Neon (database)
- Input validation with Zod
- Centralized error handling
- CORS configuration

#### Documentation
- Complete README with setup and deployment instructions
- Postman API collection
- Architecture overview
- Role permissions matrix
- Test credentials for all roles
