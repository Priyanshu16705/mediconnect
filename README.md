# 🏥 MediConnect — Healthcare Appointment Platform

> **Live Website:** [https://mediconnect-ten-sigma.vercel.app](https://mediconnect-ten-sigma.vercel.app)  
> **Backend API:** [https://mediconnect-backend-bgsa.onrender.com](https://mediconnect-backend-bgsa.onrender.com)  
> **GitHub:** [https://github.com/Priyanshu16705/mediconnect](https://github.com/Priyanshu16705/mediconnect)

A full-stack, market-ready healthcare appointment booking platform built with the MERN stack. Patients can find verified doctors, book slots, and pay online. Doctors manage their schedule, availability, and patient records. Admins verify doctors and monitor the platform.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas (AWS Mumbai) |
| Auth | JWT (HttpOnly cookies + Bearer tokens) |
| Payments | Razorpay (Orders API + Webhook verification) |
| Charts | Recharts |
| Deployment | Vercel (frontend) + Render (backend) |

---

## ✨ Features

### For Patients
- Register and log in
- Search doctors by city, specialization, name, fee, rating
- View doctor profiles, qualifications, reviews
- Real-time slot availability (auto-generated from doctor's schedule)
- Book appointments with atomic slot reservation
- Pay securely via Razorpay (UPI, cards, net banking)
- Cancel with automatic refund (full/50% based on notice period)
- View appointment history, doctor notes, prescriptions
- Write verified reviews (only after completed appointments)

### For Doctors
- Register with full professional profile
- Admin verification before going live
- Dashboard: today's schedule, revenue, rating
- Manage appointments: complete, no-show, add notes & prescription
- Slot auto-generation from working hours config
- Toggle individual slots open/close
- Mark entire days unavailable
- Edit clinic info, fees, working hours

### For Admins
- Approve or reject doctor registrations
- Activate/deactivate any doctor
- View all patients, appointments, revenue
- Analytics: 7-day revenue chart, top doctors, specialization breakdown
- Full appointment audit trail

### Security & Reliability
- Razorpay signature verification server-side
- MongoDB transactions for atomic slot booking (prevents race conditions)
- Refund policy: 100% if cancelled 24h+, 50% within 24h, 0% within 2h
- Rate limiting, NoSQL injection sanitization, Helmet security headers
- JWT expiry + cookie-based sessions
- Role-based access control (patient / doctor / admin)

---

## 🔑 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@mediconnect.in | Admin@123 |
| **Patient** | patient@mediconnect.in | Patient@123 |
| **Doctor** | priya.sharma@mediconnect.in | Doctor@123 |

---

## 📁 Project Structure

```
mediconnect/
├── backend/
│   ├── src/
│   │   ├── config/         # DB connection
│   │   ├── controllers/    # auth, doctor, appointment, admin, review
│   │   ├── middleware/     # auth (JWT), errorHandler
│   │   ├── models/         # User, Doctor, Slot, Appointment, Review
│   │   ├── routes/         # all API routes
│   │   └── utils/          # AppError, asyncHandler, sendToken, slotGenerator
│   ├── server.js
│   └── seed.js
│
└── frontend/
    └── src/
        ├── api/            # Axios client + all API functions
        ├── components/     # Navbar, ProtectedRoute
        ├── contexts/       # AuthContext
        ├── pages/
        │   ├── Home.jsx
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── DoctorsList.jsx
        │   ├── DoctorProfile.jsx
        │   ├── patient/PatientDashboard.jsx
        │   ├── doctor/DoctorDashboard.jsx
        │   └── admin/AdminDashboard.jsx
        └── App.jsx
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Razorpay test account

### 1. Clone & Install

```bash
git clone https://github.com/Priyanshu16705/mediconnect.git
cd mediconnect

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure Environment

Create `backend/.env`:
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxx
RAZORPAY_WEBHOOK_SECRET=xxxx
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Seed Database

```bash
cd backend && npm run seed
```

### 4. Run

```bash
# Terminal 1 - Backend
cd backend && node server.js

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Open `http://localhost:5173`

---

## 🚢 Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | https://mediconnect-ten-sigma.vercel.app |
| Backend | Render | https://mediconnect-backend-bgsa.onrender.com |
| Database | MongoDB Atlas (AWS Mumbai) | — |

---

## 📡 API Endpoints

### Auth
```
POST /api/auth/register/patient
POST /api/auth/register/doctor
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Doctors
```
GET  /api/doctors              # Search with filters
GET  /api/doctors/cities
GET  /api/doctors/specializations
GET  /api/doctors/:id
GET  /api/doctors/:id/slots?date=YYYY-MM-DD
PUT  /api/doctors/profile/me
PUT  /api/doctors/slots/config
PUT  /api/doctors/availability/day
```

### Appointments
```
POST /api/appointments/book
POST /api/appointments/verify-payment
GET  /api/appointments/my
PUT  /api/appointments/:id/cancel
```

### Admin
```
GET  /api/admin/stats
GET  /api/admin/analytics/revenue
GET  /api/admin/doctors/pending
PUT  /api/admin/doctors/:id/verify
GET  /api/admin/appointments
```

---

## 👨‍💻 Developer

**Priyanshu Kumar**  
B.Tech Information Technology — RGIPT, Amethi  
GitHub: [@Priyanshu16705](https://github.com/Priyanshu16705)

---

Built with ❤️ for the Indian healthcare ecosystem.
