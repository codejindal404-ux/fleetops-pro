# 🚗 FleetOps Pro — Smart Vehicle Service Management System

<p align="center">

<img src="https://img.shields.io/badge/React-19-blue?logo=react"/>
<img src="https://img.shields.io/badge/Vite-6-purple?logo=vite"/>
<img src="https://img.shields.io/badge/Node.js-Express-green?logo=node.js"/>
<img src="https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase"/>
<img src="https://img.shields.io/badge/Socket.IO-Real%20Time-black?logo=socket.io"/>
<img src="https://img.shields.io/badge/JWT-Authentication-purple?logo=jsonwebtokens"/>
<img src="https://img.shields.io/badge/TailwindCSS-UI-blue?logo=tailwindcss"/>

</p>

<p align="center">
A full-stack Smart Vehicle Service Management System designed to digitally manage vehicle maintenance, service booking, repair tracking, billing, and communication between customers, mechanics, and administrators.
</p>

---

# 📌 Project Overview

**FleetOps Pro** is a modern automotive service management platform that provides a complete digital solution for vehicle servicing operations.

The system connects:

- 👤 Customers
- 🔧 Mechanics
- 🏢 Administrators

through a centralized platform where users can manage vehicles, schedule services, monitor repairs, generate invoices, and communicate in real time.

---

# 🎥 Project Demo

<p align="center">

<img src="screenshots/fleetops-demo.gif" width="800"/>

</p>

---

# 📸 Application Screenshots

## 🔐 Login & Authentication

<p align="center">

<img src="screenshots/login.png" width="800"/>

</p>


## 👤 Customer Dashboard

<p align="center">

<img src="screenshots/customer-dashboard.png" width="800"/>

</p>


## 🔧 Mechanic Dashboard

<p align="center">

<img src="screenshots/mechanic-dashboard.png" width="800"/>

</p>


## 🏢 Admin Dashboard

<p align="center">

<img src="screenshots/admin-dashboard.png" width="800"/>

</p>

---

# 🌟 Key Features & Highlights

## 🔒 Role-Based Access Control (RBAC)

FleetOps Pro provides secure role-based workflows for:

- Customers
- Mechanics
- Administrators

Each role has specific permissions:

### Customer
- Register/Login
- Add vehicles
- Book services
- Track repair progress
- View invoices
- Submit feedback

### Mechanic
- View assigned tasks
- Update repair status
- Add repair logs
- Record labour hours
- Complete service jobs

### Administrator
- Manage users
- Approve services
- Assign mechanics
- Monitor operations
- Manage billing
- View reports

---

# 🚘 Vehicle & Maintenance Management

The system provides complete vehicle lifecycle management:

- Vehicle registration
- Vehicle information management
- Mileage tracking
- Service history
- Maintenance reminders
- Vehicle health monitoring

---

# 🔄 Smart Service Booking Workflow

Service requests follow a controlled lifecycle:

```
PENDING
   ↓
APPROVED
   ↓
ASSIGNED
   ↓
INSPECTION
   ↓
REPAIRING
   ↓
QUALITY_CHECK
   ↓
COMPLETED
```

This ensures proper workflow management and prevents unauthorized status changes.

---

# 🔧 Mechanic Task & Repair Management

Mechanics can:

- Receive assigned service requests
- Update repair progress
- Add repair logs
- Track replaced parts
- Record labour hours
- Complete maintenance tasks

---

# 💳 Billing & Invoice Management

FleetOps Pro supports:

- Automatic invoice generation
- Service cost calculation
- Tax calculation
- Payment tracking
- Digital billing records

---

# ⚡ Real-Time Communication

Implemented using Socket.IO WebSockets:

- Live service updates
- Repair status notifications
- Customer-mechanic communication
- Instant dashboard updates

---

# ☁️ Database Architecture

The system uses:

### Firebase Firestore

Cloud-based NoSQL database for:

- User management
- Vehicle records
- Bookings
- Service information
- Transactions


### Local JSON Database

Development storage:

```
dev.db.json
```

Used for local testing and development.

---

# 🛠 Technology Stack

## Frontend

| Technology | Purpose |
|---|---|
| React 19 | User Interface |
| Vite | Build Tool |
| Tailwind CSS | Styling |
| Lucide React | Icons |
| Framer Motion | Animations |
| Recharts | Data Visualization |
| React Leaflet | Maps |

---

## Backend

| Technology | Purpose |
|---|---|
| Node.js | Runtime Environment |
| Express.js | REST API |
| Socket.IO | Real-Time Communication |
| Firebase Admin SDK | Database Integration |
| JWT | Authentication |
| bcryptjs | Password Security |
| Helmet | API Security |
| Express Validator | Input Validation |

---

# 🚀 Installation & Setup

## Clone Repository

```bash
git clone https://github.com/codejindal404-ux/fleetops-pro.git

cd fleetops-pro
```

---

## Install Dependencies

```bash
npm install
```

---

## Environment Configuration

Create `.env` file:

```env
PORT=3000

JWT_SECRET=your_secret_key

JWT_EXPIRES_IN=7d

FIREBASE_PROJECT_ID=your_project_id

FIREBASE_CLIENT_EMAIL=your_client_email

FIREBASE_PRIVATE_KEY=your_private_key
```

---

## Run Application

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

# 📊 Database Models

Main entities:

```
User
 |
 ├── Vehicle
 |
 ├── Booking
 |
 ├── RepairLog
 |
 ├── Invoice
 |
 ├── Feedback
 |
 └── ServiceCenter
```

---

# 🏗 System Architecture

```
              Users
                |
                ↓
        React Frontend
                |
                ↓
        Express API Server
                |
                ↓
     Authentication Middleware
                |
                ↓
        Business Logic Layer
                |
                ↓
       Firebase Firestore
```

---

# 🌱 Sustainable Development Goals (SDG)

## SDG 9: Industry, Innovation and Infrastructure

FleetOps Pro supports:

- Digital transformation of automotive services
- Technology-driven maintenance solutions
- Improved service infrastructure


## SDG 12: Responsible Consumption and Production

FleetOps Pro helps:

- Increase vehicle lifespan
- Reduce unnecessary replacement
- Encourage preventive maintenance

---

# 📁 Project Structure

```
fleetops-pro/

├── src/
│   ├── components/
│   │   ├── admin/
│   │   ├── customer/
│   │   └── mechanic/
│   │
│   ├── services/
│   └── seed.ts
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   └── services/
│
├── server.ts
├── package.json
├── dev.db.json
├── postman_collection.json
└── README.md
```

---

# 🧪 Testing

The project supports testing of:

✅ Authentication  
✅ Vehicle Management  
✅ Service Booking  
✅ Mechanic Assignment  
✅ Repair Status Updates  
✅ Invoice Generation  
✅ Role Permissions  

---

# 🔮 Future Enhancements

Planned improvements:

- AI-based predictive maintenance
- Mobile application
- GPS fleet tracking
- Advanced vehicle diagnostics
- Online payment gateway
- Email/SMS notifications
- Multiple service center management

---

# 👨‍💻 Author

**Krish Jindal**

Project:

**FleetOps Pro — Smart Vehicle Service Management System**

---

# 📄 License

This project is developed for educational and prototype purposes.
