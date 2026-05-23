# PINAKA Smart Farm Management System

> **Version:** 1.0.0 (Client Presentation Build)  
> **Last Updated:** May 2026  
> **Team:** Frontend (Mahesh) · Backend (Kalyan) · DevOps (Sai)  
> **Client:** PINAKA Farm Operations

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Module Breakdown](#4-module-breakdown)
5. [Data Architecture & Relationships](#5-data-architecture--relationships)
6. [Lifecycle Intelligence](#6-lifecycle-intelligence)
7. [Automation & Business Logic](#7-automation--business-logic)
8. [UI/UX Design System](#8-uiux-design-system)
9. [Security & Authentication](#9-security--authentication)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Folder Structure](#11-folder-structure)
12. [Environment Variables](#12-environment-variables)
13. [API Endpoints](#13-api-endpoints)
14. [Known Limitations (v1.0)](#14-known-limitations-v10)
15. [Roadmap](#15-roadmap)
16. [Project Pricing & Value](#16-project-pricing--value)

---

## 1. Project Overview

**PINAKA Smart Farm Management System** is a full-stack enterprise-grade livestock management platform designed specifically for pig farming operations. It provides a centralized digital system to manage the complete lifecycle of every animal — from birth to sale — with intelligent automation, operational dashboards, and financial tracking.

### Problem It Solves

Pig farms traditionally manage records using paper registers, Excel sheets, and disconnected tools. This causes:
- Lost breeding history
- Missed vaccination schedules
- No visibility into mortality rates
- Manual revenue calculation errors
- No unified animal identity across operations

### What PINAKA Delivers

PINAKA replaces all of this with a unified, intelligent, real-time operational platform where **every pig has a digital identity** and every farm event (breeding, farrowing, treatment, sale) is tracked, automated, and reportable.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18 (Vite) |
| **Routing** | React Router v6 |
| **State Management** | Zustand |
| **Styling** | Tailwind CSS v3 + Custom CSS Design System |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **HTTP Client** | Axios |
| **Backend Framework** | Node.js + Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Authentication** | JWT (JSON Web Tokens) |
| **API Proxy (Dev)** | Vite Dev Server Proxy |
| **Frontend Hosting** | Vercel |
| **Backend Hosting** | Render / Railway (planned) |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────┐
│                    CLIENT BROWSER               │
│              React SPA (Vite Build)             │
│        Zustand State  ←→  localStorage          │
└─────────────────┬───────────────────────────────┘
                  │ HTTP / REST API
┌─────────────────▼───────────────────────────────┐
│              BACKEND (Express.js)               │
│         JWT Auth Middleware → Controllers       │
│              Business Logic / Automation        │
└─────────────────┬───────────────────────────────┘
                  │ Mongoose ODM
┌─────────────────▼───────────────────────────────┐
│              DATABASE (MongoDB)                 │
│   Animal · Sow · Boar · Grower · Breeding      │
│   Farrowing · Treatment · Medicine · Sale       │
│   Mortality · CashBook · User                  │
└─────────────────────────────────────────────────┘
```

### Current State (v1.0 - Presentation Build)

The **frontend currently operates in offline/localStorage mode** using Zustand stores with mock seed data. This was intentional for the client UI presentation without requiring a live database connection. The backend Express/MongoDB code is fully scaffolded and ready — it simply needs the MongoDB connection string configured to go live.

---

## 4. Module Breakdown

The system contains **15 operational modules**, organized into 4 functional layers:

### Layer 1: Livestock Identity
| Module | Route | Status |
|---|---|---|
| **Master Animal Stock Register** | `/stock` | ✅ Live |

### Layer 2: Lifecycle Management
| Module | Route | Status |
|---|---|---|
| **Grower Record Card** | `/growers` | ✅ Live |
| **Sow Record Card** | `/sows` | ✅ Live |
| **Boar Record Card** | `/boars` | ✅ Live |

### Layer 3: Reproductive Workflow
| Module | Route | Status |
|---|---|---|
| **Breeding Record** | `/breeding` | ✅ Live |
| **Farrowing Record** | `/farrowing` | ✅ Live |
| **Parity / Litter Record** | `/parity` | ✅ Live |

### Layer 4: Health Operations
| Module | Route | Status |
|---|---|---|
| **Treatment Register** | `/treatment` | ✅ Live |
| **Medicine & Vaccine Register** | `/medicine` | ✅ Live |
| **Mortality Register** | `/mortality` | ✅ Live |

### Layer 5: Commercial & Financial
| Module | Route | Status |
|---|---|---|
| **Sale Register** | `/sales` | ✅ Live |
| **Cash Book** | `/cashbook` | ✅ Live |
| **Reports & Analytics** | `/reports` | ✅ Live |

### Layer 6: System
| Module | Route | Status |
|---|---|---|
| **Authentication** | `/login`, `/signup` | ✅ Live |
| **Settings** | `/settings` | 🔜 Planned |

---

## 5. Data Architecture & Relationships

### Master Identity Model: `Animal`
Every pig in the farm has one record in `Animal`. This is the **Single Source of Truth** for identity.

```
Animal {
  animalNo       // Unique system ID (e.g. S-101, G-302)
  earTag         // Physical ear tag
  dob            // Date of birth
  sex            // Male / Female
  breed          // Large White, Duroc, Landrace, etc.
  currentWeight
  source         // Farm Born / Purchased / Imported
  lifecycleStage // Piglet → Grower → Sow/Boar → Sold / Dead
  operationalStatus // Active / Under Treatment / Pregnant / etc.
  currentPen
}
```

### Lifecycle Hierarchy

```
Animal (Master Identity)
    │
    ├─ Grower (growth tracking)
    │      └─ promote → Sow / Boar
    │
    ├─ Sow (reproductive lifecycle)
    │      └─ Breeding → Farrowing → Parity/Litter
    │              │
    │              └─ Piglets → Grower (auto batch transfer)
    │
    ├─ Boar (stud management)
    │
    ├─ Treatment (health events → any animal)
    ├─ Medicine (inventory consumed by treatments)
    ├─ Mortality (closing lifecycle)
    ├─ Sale (commercial exit)
    └─ CashBook (financial tracking)
```

---

## 6. Lifecycle Intelligence

### Grower → Sow/Boar Promotion
- Grower can be promoted to Sow or Boar from the Grower detail page
- Age eligibility gate: minimum 150 days (warning shown < 150 days)
- On promotion: grower status closes, new Sow/Boar record auto-created

### Sow Heat Cycle Automation
- When a Sow is promoted: enters "Heat Cycle Management" automatically
- Heat cycle windows tracked with scheduled next-heat dates
- Status progression: `Waiting For Heat` → `In Heat` → `Bred` → `Confirmed Pregnant` → `Farrowing Due` → `Lactating` → `Weaned` → `Waiting For Heat`

### Farrowing → Parity (Litter Management)
- On farrowing record creation: piglets auto-generated with unique IDs
- Format: `L-{SowNo}-{BatchNo}-{PigletNo}` (e.g. `L-S-101-8492-3`)
- Health & vaccine schedule tracked per litter batch during 2-month lactation

### Weaning → Grower Transfer
- On wean confirmation: each piglet auto-transferred to Grower module
- Grower IDs: `G-{SowNo}-{BatchNo}-{PigletNo}`
- Sow status auto-resets to `Waiting For Heat`

### Sale → Cash Book Automation
- Recording a sale → auto-creates Income entry in Cash Book
- Animal lifecycle stage → auto-updated to `Sold`

### Mortality → Animal Registry Sync
- Recording mortality → auto-marks animal as `Dead` in Master Registry
- All active lifecycle operations closed

---

## 7. Automation & Business Logic

| Event | Auto-Actions Triggered |
|---|---|
| Grower promoted to Sow | New Sow record created, heat cycle initialized |
| Grower promoted to Boar | New Boar record created, stud record initialized |
| Breeding service recorded | Expected farrowing date auto-calculated (115 days) |
| Farrowing recorded | Piglets auto-generated with unique IDs, expected wean date set (60 days) |
| Weaning confirmed | Sow status → `Waiting For Heat`, piglets → Grower module |
| Sale recorded | Animal → `Sold`, income entry created in Cash Book |
| Mortality recorded | Animal → `Dead`, active operations closed |
| Medicine added | Status auto-computed (Available / Low Stock / Expired / Out of Stock) |
| Treatment logged | Animal operational status updated |

---

## 8. UI/UX Design System

### Theme
- **Mode:** Dark enterprise operational theme (default)
- **Light mode:** Available via toggle in top navbar
- **Primary Color:** `#FF6B00` (PINAKA Orange)

### Design Tokens (CSS Variables)
| Token | Dark Value | Light Value |
|---|---|---|
| `--color-background` | `#121212` | `#FFFDF9` |
| `--color-primary` | `#FF6B00` | `#FF6B00` |
| `--color-success` | `#4CAF50` | `#2E7D32` |
| `--color-danger` | `#EF5350` | `#C62828` |
| `--color-warning` | `#FF9800` | `#F57C00` |

### Component Library (Custom)
- `DataTable` — sortable, searchable operational table
- `StatusBadge` — color-coded lifecycle status indicator
- `Modal` — reusable form overlay
- `FormField / FormGrid / FormSection` — structured form layouts
- `CardSkeleton / TableSkeleton` — loading state animations
- `MainLayout` — sidebar + topnav shell

### Typography
- **Primary Font:** Inter (Google Fonts)
- **Monospace Font:** JetBrains Mono (animal IDs, codes)

### Sidebar Navigation
- 15-module collapsible sidebar
- Active state highlighting
- Mobile responsive overlay
- Role-based user display

---

## 9. Security & Authentication

- **JWT-based authentication** (HTTP-only token strategy in production)
- **Protected routes** via `ProtectedRoute` wrapper component
- All API routes require a valid JWT Bearer token
- Passwords hashed using bcrypt
- Role-based access (Admin / Operator) — planned for v2

---

## 10. Deployment Architecture

### Current (Presentation Build)
| Service | Provider | Status |
|---|---|---|
| Frontend | Vercel | ✅ Ready to deploy |
| Backend | Not deployed | Scaffolded only |
| Database | Not configured | MongoDB Atlas ready |

### Production Architecture (Planned)
| Service | Provider |
|---|---|
| Frontend | Vercel |
| Backend API | Render.com or Railway |
| Database | MongoDB Atlas (M0 free → M10 paid) |
| File Storage | Cloudinary (for future animal photos) |

### Vercel Deployment Config (`vercel.json`)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 11. Folder Structure

```
Pinaka-farm-Management/
├── src/                        # React Frontend
│   ├── components/
│   │   ├── layout/             # MainLayout, Sidebar, ProtectedRoute
│   │   └── ui/                 # DataTable, Modal, StatusBadge, etc.
│   ├── features/               # Module-specific pages
│   │   ├── boars/
│   │   ├── breeding/
│   │   ├── farrowing/
│   │   ├── growers/
│   │   ├── parity/
│   │   ├── sows/
│   │   └── stock/
│   ├── pages/                  # Top-level route pages
│   │   ├── AnimalStockRecord.jsx
│   │   ├── BoarRecord.jsx
│   │   ├── BreedingRecord.jsx
│   │   ├── CashBookRecord.jsx
│   │   ├── FarrowingRecord.jsx
│   │   ├── GrowerRecord.jsx
│   │   ├── Login.jsx
│   │   ├── MedicineRecord.jsx
│   │   ├── MortalityRecord.jsx
│   │   ├── ParityRecord.jsx
│   │   ├── ReportsRecord.jsx
│   │   ├── SaleRecord.jsx
│   │   ├── SowRecord.jsx
│   │   └── TreatmentRecord.jsx
│   ├── store/                  # Zustand state management
│   │   ├── useAnimalStore.js
│   │   ├── useAuthStore.js
│   │   ├── useBoarStore.js
│   │   ├── useBreedingStore.js
│   │   ├── useCashBookStore.js
│   │   ├── useFarrowingStore.js
│   │   ├── useGrowerStore.js
│   │   ├── useMedicineStore.js
│   │   ├── useMortalityStore.js
│   │   ├── useSaleStore.js
│   │   ├── useSowStore.js
│   │   └── useTreatmentStore.js
│   ├── api/                    # Axios API client
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css               # Global CSS + Design Tokens
│
├── server/                     # Node.js Backend
│   ├── config/                 # MongoDB connection
│   ├── controllers/            # Business logic handlers
│   ├── middleware/             # Auth, error handling
│   ├── models/                 # Mongoose schemas
│   │   ├── Animal.js
│   │   ├── Boar.js
│   │   ├── Breeding.js
│   │   ├── CashBook.js
│   │   ├── Farrowing.js
│   │   ├── Grower.js
│   │   ├── Medicine.js
│   │   ├── Mortality.js
│   │   ├── Sale.js
│   │   ├── Sow.js
│   │   ├── Treatment.js
│   │   └── User.js
│   ├── routes/                 # Express route definitions
│   ├── utils/                  # Async handler, custom errors
│   └── server.js               # Express entry point
│
├── .gitignore
├── vercel.json
├── package.json                # Frontend dependencies
├── tailwind.config.js
├── vite.config.js
└── index.html
```

---

## 12. Environment Variables

### Frontend (`.env` in root — NOT committed to Git)
```env
VITE_API_BASE_URL=http://localhost:5000
```

### Backend (`server/.env` — NOT committed to Git)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/pinaka_farm
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
```

---

## 13. API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Animals (Master Registry)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/animals` | Get all animals |
| POST | `/api/animals` | Register new animal |
| GET | `/api/animals/:id` | Get animal by ID |
| PUT | `/api/animals/:id` | Update animal |

### Growers
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/growers` | All growers |
| POST | `/api/growers` | Add grower |
| POST | `/api/growers/:id/promote/sow` | Promote to Sow |
| POST | `/api/growers/:id/promote/boar` | Promote to Boar |

### Breeding
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/breeding` | All service records |
| POST | `/api/breeding` | Log new service |
| PUT | `/api/breeding/:id/pregnancy` | Update pregnancy status |

### Farrowing
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/farrowing` | All farrowing records |
| POST | `/api/farrowing` | Create farrowing record |
| POST | `/api/farrowing/:id/wean` | Confirm weaning |
| POST | `/api/farrowing/:id/transfer` | Transfer piglets to Grower |

> Similar CRUD endpoints exist for: Sows, Boars, Treatments, Medicines, Mortalities, Sales, CashBook

---

## 14. Known Limitations (v1.0)

1. **Offline-first mode:** All data currently persists in `localStorage`. A MongoDB Atlas connection is required for multi-user production use.
2. **No real-time sync:** Multiple users on different devices will not see each other's data without the backend connected.
3. **Settings module:** Not yet implemented.
4. **Role-based access control:** All logged-in users have equal permissions. Admin/Operator roles planned for v2.
5. **Mobile optimization:** The UI is responsive but optimized primarily for desktop/tablet use (operational farm management).
6. **No file uploads:** Animal photos and documents not yet supported.

---

## 15. Roadmap

### v1.1 — Backend Integration
- [ ] Connect to MongoDB Atlas
- [ ] Replace localStorage stores with real API calls
- [ ] Deploy backend to Render/Railway

### v1.2 — Advanced Operations
- [ ] Settings module (user management, farm config)
- [ ] Push notifications for heat cycles, farrowing due dates
- [ ] PDF report generation

### v2.0 — Multi-Farm & Mobile
- [ ] Role-based access control (Admin / Operator / Viewer)
- [ ] Native mobile app (React Native)
- [ ] Multi-farm support
- [ ] Animal photo uploads (Cloudinary)
- [ ] Feed management module (connected to lifecycle weight tracking)

---

## 16. Project Pricing & Value

### Development Scope Summary

| Category | Hours Estimated |
|---|---|
| UI/UX Design System & Layout | 25 hrs |
| Authentication System | 8 hrs |
| Grower Module (full lifecycle) | 15 hrs |
| Sow Module + Heat Cycle Automation | 20 hrs |
| Boar Module | 10 hrs |
| Breeding Module | 15 hrs |
| Farrowing Module | 15 hrs |
| Parity/Litter Record Module | 15 hrs |
| Master Animal Stock Register | 10 hrs |
| Treatment Register | 10 hrs |
| Medicine & Vaccine Register | 10 hrs |
| Mortality Register | 8 hrs |
| Sale Register | 10 hrs |
| Cash Book | 10 hrs |
| Reports & Analytics Dashboard | 12 hrs |
| Backend (Express + MongoDB schemas) | 20 hrs |
| State Management (Zustand, 12 stores) | 15 hrs |
| QA, Bug Fixes, Deployment Setup | 10 hrs |
| **Total Estimated Hours** | **~228 hrs** |

---

### Pricing Breakdown

#### Option A — Freelance Market Rate (India)

| Tier | Rate | Total |
|---|---|---|
| Junior (1–3 yrs) | ₹500–800/hr | ₹1.14L – ₹1.82L |
| Mid-level (3–5 yrs) | ₹1,000–1,500/hr | ₹2.28L – ₹3.42L |
| Senior (5+ yrs) | ₹2,000–3,000/hr | ₹4.56L – ₹6.84L |
| **3-person team (recommended)** | — | **₹3.5L – ₹5.5L** |

#### Option B — Fixed Project Pricing (Recommended for Client)

| Package | What's Included | Price |
|---|---|---|
| **Basic** | Frontend only, no backend integration | ₹1,20,000 |
| **Standard** | Full frontend + backend + MongoDB (no deployment) | ₹2,50,000 |
| **Professional** | Full stack + deployment + 3 months support | ₹3,75,000 |
| **Enterprise** | Everything + mobile app + multi-farm + 1 year support | ₹7,00,000+ |

#### Current Delivery (v1.0 Client Presentation)
> Based on what's been built — 13 fully operational modules, enterprise UI, Zustand state, full localStorage persistence, real-time automations, and reports — **a fair charge for this current build is between ₹1,80,000 – ₹2,50,000** depending on your contract arrangement.

#### International Market (USD)
| Market | Fair Rate |
|---|---|
| Indian freelance market | $1,500 – $3,500 |
| International platforms (Upwork, Toptal) | $5,000 – $15,000 |
| US/UK enterprise software market | $15,000 – $40,000 |

---

> **Note:** Pricing depends on whether you're billing hourly vs. fixed, whether it's a one-time delivery or includes support, and the client's industry/budget. For an agriculture-tech client in India building an enterprise system for an actual running farm operation, **₹2.5L – ₹3.5L is a fair and professional range.**
