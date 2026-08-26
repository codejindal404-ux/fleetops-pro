# 🚗 FleetOps Pro — Smart Vehicle Service Management System

A full-stack, enterprise-grade **Smart Vehicle Service Management System** built with **Node.js, Express.js, Socket.IO WebSockets, Google Firebase Firestore, and JWT Authentication**, paired with a modern **React 19 + Tailwind CSS** operational dashboard.

---

## 🌟 Key Features & Highlights

- **🔒 Multi-Role Access Control (RBAC)**: Distinct workflows and security policies for **Customers**, **Mechanics**, and **System Administrators**.
- **☁️ Cloud & Local Database Engine**: Dual storage support with **Google Firebase Firestore NoSQL** (`fleetops-pro-98e1d`) and a local atomic JSON document store (`dev.db.json`).
- **🚘 Fleet & Maintenance Tracking**: Track vehicle mileage, service history, and automated 30-minute preventive maintenance reminders.
- **🔄 Service Booking Pipeline**: Strict forward-only state machine transition (`PENDING` → `APPROVED` → `ASSIGNED` → `INSPECTION` → `REPAIRING` → `QUALITY_CHECK` → `COMPLETED`).
- **🔧 Mechanic Task Dispatch & Repair Logs**: Assign mechanics, record repair progress notes, log labor hours, and request spare parts.
- **💳 Automated Billing & Payments**: Generate itemized invoices with tax calculations and simulate instant payment processing.
- **⚡ Real-Time Socket.IO Updates**: Instant WebSocket notifications for repair progress, booking status changes, and customer-mechanic chat.
- **🧪 Built-in Interactive Test Suite**: Integrated **RBAC Test Suite Modal** and **Postman Collection Viewer** directly inside the top navigation bar.

---

## 🛠 Tech Stack

### Backend
- **Framework**: Node.js & Express.js (ES Modules)
- **Real-Time WebSockets**: `socket.io`
- **Cloud Database**: Google Firebase Firestore (`firebase`, `firebase-admin`)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`
- **Validation & Security**: `express-validator`, `cors`, `helmet`, `express-rate-limit`

### Frontend
- **Framework**: React 19, Vite 6
- **Styling & UI**: Tailwind CSS, Lucide React, Motion (Framer Motion)
- **Charts & Maps**: Recharts, Leaflet / React-Leaflet

---

## 🔑 Pre-Configured Test Account Credentials

All seeded accounts use the password **`Password123!`**:

| Role | Full Name | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **`ADMIN`** | System Administrator | `admin@fleetops.com` | `Password123!` | Full System Access, Mechanic Assignment, Billing & Invoicing, Audit Logs |
| **`CUSTOMER`** | Jordan Miller | `customer@fleetops.com` | `Password123!` | Add/Manage Vehicles, Book Services, Pay Invoices, Rate Completed Jobs |
| **`MECHANIC`** | Alex Rivera | `mechanic@fleetops.com` | `Password123!` | View Assigned Tasks, Post Repair Logs, Inspect Diagnostics, Complete Jobs |

---

## 🚀 Setup & Execution Guide

### 1. Environment Configuration (`.env`)
Create or edit `.env` in the root folder:
```env
PORT=3000
JWT_SECRET="fleetops_super_secret_jwt_key_2026_x987"
JWT_EXPIRES_IN="7d"
DATABASE_URL="file:./dev.db"
```

### 2. Run Development Server (Unified API + React SPA)
Starts Express server on port **3000** with Vite middleware hot-reloading:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

### 3. Database Seeding Commands
- **Seed Firebase Firestore Database**:
  ```bash
  npx tsx backend/src/services/firebaseSeed.ts
  ```
- **Seed Local JSON Database (`dev.db.json`)**:
  ```bash
  npm run seed
  ```

### 4. Type Check & Production Build
```bash
# Type check TypeScript codebase
npm run lint

# Build production bundle (Vite SPA + Node.js bundle)
npm run build

# Start production server
npm run start
```

---

## 📖 Complete API Endpoints Reference

### 1. Auth Module (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new customer (`CUSTOMER` role) |
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT token |
| `GET` | `/api/auth/me` | Protected | Fetch current user profile |
| `POST` | `/api/auth/create-staff` | `ADMIN` | Register new `ADMIN` or `MECHANIC` user |
| `POST` | `/api/auth/otp/request` | Public | Generate 6-digit OTP code |
| `POST` | `/api/auth/otp/verify` | Public | Verify OTP code |

### 2. Vehicle Module (`/api/vehicles`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/vehicles` | Customer | Add a vehicle owned by logged-in customer |
| `GET` | `/api/vehicles` | Protected | List vehicles (Customer: own; Staff: all) |
| `GET` | `/api/vehicles/:id` | Protected | Get single vehicle details with booking history |
| `PUT` | `/api/vehicles/:id` | Owner/Admin | Update vehicle mileage, registration or details |
| `DELETE` | `/api/vehicles/:id` | Owner/Admin | Remove a vehicle record |

### 3. Booking Module (`/api/bookings`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings` | Customer | Book a service appointment for an owned vehicle |
| `GET` | `/api/bookings` | Protected | List bookings with optional status filtering |
| `GET` | `/api/bookings/:id` | Protected | Full booking summary, logs, invoice & rating |
| `PATCH` | `/api/bookings/:id/status` | Staff | Forward-only status transition |
| `PATCH` | `/api/bookings/:id/assign-mechanic` | `ADMIN` | Assign mechanic & set status `ASSIGNED` |
| `POST` | `/api/bookings/:id/repair-logs` | Staff | Add repair progress log note & labor hours |
| `GET` | `/api/bookings/:id/repair-logs` | Protected | View repair logs for a booking |

### 4. Billing Module (`/api`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings/:id/invoice` | `ADMIN` | Create invoice for `COMPLETED` booking |
| `GET` | `/api/invoices` | Protected | List invoices (Customer: own; Admin: all) |
| `GET` | `/api/invoices/:id` | Protected | Get single invoice details |
| `PATCH` | `/api/invoices/:id/pay` | Customer/Admin | Simulate invoice payment (marks `PAID`) |

### 5. Feedback Module (`/api`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings/:id/feedback` | Customer | Submit 1-5 star rating & comment |
| `GET` | `/api/feedback` | Protected | View feedback reviews |
| `GET` | `/api/mechanics/:id/rating` | Protected | Computed live average rating for a mechanic |

---

## 🔄 Service Booking Pipeline

```
[ PENDING ] ───────► [ APPROVED ] ───────► [ ASSIGNED ]
     │                    │                     │
     └─────────┬──────────┴──────────┬──────────┘
               ▼                     ▼
        [ CANCELLED ]         [ INSPECTION ]
                                     │
                                     ▼
                              [ REPAIRING ]
                                     │
                                     ▼
                            [ QUALITY_CHECK ]
                                     │
                                     ▼
                              [ COMPLETED ]
```

---

## 📁 Directory Architecture

```
fleetops-pro/
├── backend/
│   └── src/
│       ├── config/           # App & Firebase configurations
│       ├── controllers/      # Route logic controllers
│       ├── middlewares/      # Auth, Role & Error middlewares
│       ├── routes/           # Express API route modules
│       ├── services/         # Core services (dbStore, socket, reminder)
│       └── validators/       # Input validation schemas
├── src/
│   ├── components/           # React 19 UI View Components
│   ├── config/               # Frontend configs
│   ├── lib/                  # Shared frontend libraries
│   └── seed.ts               # Local DB seed script
├── firebase-applet-config.json # Firebase Web SDK Project Config
├── dev.db.json               # Persisted local JSON Database
├── postman_collection.json   # Postman Collection for API Testing
├── server.ts                 # Express + Socket.IO + Vite Entrypoint
├── package.json              # Project dependencies & npm scripts
└── tsconfig.json             # TypeScript configuration
```

---

## 🤝 Postman Collection & Testing
Import [`postman_collection.json`](file:///c:/Users/krish/OneDrive/Desktop/BEE%20Project/fleetops-pro/postman_collection.json) into Postman. Logging in via `/api/auth/login` automatically sets the `jwt_token` environment variable for seamless authorization across all endpoints!
#   F l e e t O p s   P r o   U p d a t e d   D o c u m e n t a t i o n  
 