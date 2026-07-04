# 🏥 MediConnect — Healthcare Appointment Platform

A full-stack, market-ready healthcare appointment booking platform built with the MERN stack. Patients can find verified doctors, book slots, and pay online. Doctors manage their schedule, availability, and patient records. Admins verify doctors and monitor the platform.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (HttpOnly cookies + Bearer tokens) |
| Payments | Razorpay (Orders API + Webhook verification) |
| Charts | Recharts |

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
- Mark entire days unavailable (with auto-cancellation of affected bookings)
- Edit clinic info, fees, working hours

### For Admins
- Approve or reject doctor registrations (with reason)
- Activate/deactivate any doctor
- View all patients, appointments, revenue
- Analytics: 7-day revenue chart, top doctors, specialization breakdown
- Full appointment audit trail

### Security & Reliability
- Razorpay signature verification server-side (never trust frontend amount)
- MongoDB transactions for atomic slot booking (prevents race conditions/double-booking)
- Refund policy: 100% if cancelled 24h+, 50% within 24h, 0% within 2h
- Rate limiting on all API routes, stricter on auth endpoints
- NoSQL injection sanitization
- Helmet security headers
- JWT expiry + cookie-based sessions
- Role-based access control (patient / doctor / admin)

---

## 📁 Project Structure

```
healthcare-app/
├── backend/
│   ├── src/
│   │   ├── config/         # DB connection
│   │   ├── controllers/    # authController, doctorController, appointmentController, adminController, reviewController
│   │   ├── middleware/     # auth.js (JWT), errorHandler.js
│   │   ├── models/         # User, Doctor, Slot, Appointment, Review
│   │   ├── routes/         # authRoutes, doctorRoutes, appointmentRoutes, adminRoutes, reviewRoutes
│   │   └── utils/          # AppError, asyncHandler, sendToken, slotGenerator
│   ├── server.js
│   ├── seed.js             # Seed admin + 5 sample doctors
│   └── .env.example
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
        │   ├── DoctorProfile.jsx      # Booking + Razorpay checkout
        │   ├── patient/PatientDashboard.jsx
        │   ├── doctor/DoctorDashboard.jsx
        │   └── admin/AdminDashboard.jsx
        └── App.jsx
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Razorpay account (test mode keys)

### 1. Clone & Install

```bash
git clone <your-repo>
cd healthcare-app

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/healthcare
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# From Razorpay Dashboard → Test Mode
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Also create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Seed Database

```bash
cd backend
npm run seed
```

This creates:
- **Admin:** admin@mediconnect.in / Admin@123
- **Patient:** patient@mediconnect.in / Patient@123
- **5 Doctors** across Delhi, Mumbai, Hyderabad, Chandigarh, Kochi (all pre-verified)

### 4. Run

```bash
# Terminal 1 — Backend
cd backend
npm run dev   # or: npm start

# Terminal 2 — Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health check: http://localhost:5000/api/health

---

## 💳 Razorpay Setup (Test Mode)

1. Create account at [razorpay.com](https://razorpay.com)
2. Go to Settings → API Keys → Generate Test Mode Keys
3. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `.env`
4. For webhooks (optional locally): use [ngrok](https://ngrok.com) to expose localhost, then add webhook URL in Razorpay dashboard

**Test card:** 4111 1111 1111 1111, any future date, any CVV  
**Test UPI:** success@razorpay

---

## 🚢 Deployment

### Backend → Render
1. Push to GitHub
2. Create new Web Service on Render → connect repo
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add all `.env` variables in Render's Environment section
6. Use MongoDB Atlas connection string for `MONGO_URI`

### Frontend → Vercel
1. Push to GitHub
2. Import project in Vercel
3. Set root directory to `frontend`
4. Add `VITE_API_URL=https://your-render-backend.onrender.com/api`
5. Deploy

---

## 📡 API Endpoints

### Auth
```
POST /api/auth/register/patient
POST /api/auth/register/doctor
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
PUT  /api/auth/update-password
```

### Doctors (Public)
```
GET  /api/doctors              # Search with filters
GET  /api/doctors/cities
GET  /api/doctors/specializations
GET  /api/doctors/:id
GET  /api/doctors/:id/slots?date=YYYY-MM-DD
```

### Doctors (Doctor only)
```
GET  /api/doctors/dashboard/me
PUT  /api/doctors/profile/me
PUT  /api/doctors/slots/config
PUT  /api/doctors/availability/day
PUT  /api/doctors/slots/:slotId/toggle
GET  /api/doctors/appointments/me
PUT  /api/doctors/appointments/:id
```

### Appointments (Patient only)
```
POST /api/appointments/book
POST /api/appointments/verify-payment
GET  /api/appointments/my
GET  /api/appointments/:id
PUT  /api/appointments/:id/cancel
POST /api/appointments/webhook/razorpay
```

### Admin
```
GET  /api/admin/stats
GET  /api/admin/analytics/revenue
GET  /api/admin/doctors
GET  /api/admin/doctors/pending
PUT  /api/admin/doctors/:id/verify
PUT  /api/admin/doctors/:id/toggle
GET  /api/admin/patients
GET  /api/admin/appointments
```

### Reviews
```
GET  /api/reviews/doctor/:doctorId
POST /api/reviews
PUT  /api/reviews/:id
DELETE /api/reviews/:id
```

---

## 🔐 Security Checklist (Production)

- [ ] Change `JWT_SECRET` to a random 64-char string
- [ ] Use MongoDB Atlas with IP allowlist
- [ ] Enable Razorpay webhook signature verification
- [ ] Set `NODE_ENV=production`
- [ ] Add SSL/HTTPS (automatic on Render/Vercel)
- [ ] Set `CORS` origin to your exact frontend domain
- [ ] Enable MongoDB Atlas audit logs
- [ ] Review Razorpay's KYC requirements for live mode

---

## 📋 What to Add for v2 (Market Expansion)

- [ ] Doctor KYC document upload (Aadhar, MCI certificate)
- [ ] SMS/WhatsApp notifications via Twilio / MSG91
- [ ] Email confirmations via SendGrid / Nodemailer
- [ ] Video consultation (WebRTC or Zoom SDK integration)
- [ ] Prescription PDF generation
- [ ] Follow-up appointment booking from completed appointment
- [ ] Multi-language support (Hindi, Tamil, Telugu)
- [ ] Mobile app (React Native)
- [ ] Doctor payout system (Razorpay Route/Transfers)

---

Built with ❤️ for the Indian healthcare ecosystem.
