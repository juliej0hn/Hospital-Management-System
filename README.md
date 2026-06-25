# 🏥 Hayat Hospital — Appointment & Queue Management Platform

A web-based Hospital Management System built with **Node.js, Express, and MongoDB**. It lets patients book appointments with doctors, gives doctors a dashboard to manage their daily slots and queue, and gives admins full control over the doctor roster — all with real-time queue position estimates and automated email notifications.

## ✨ Features

### 👤 Patient (Client)
- Sign up / log in with email & password (passwords hashed with bcrypt)
- Browse available doctors by sector (Cardiology, Pediatrics, General, Orthopedics)
- Book an appointment (Consultation, Follow-up, or Lab Result) and get an **estimated appointment time** based on your position in the doctor's queue
- Cancel an existing appointment
- View and update profile info (phone number, medical history)
- Upload medical reports/files (stored locally in dev, on Cloudinary in production)
- Receive email notifications (via Resend) when an appointment is rescheduled or cancelled

### 🩺 Doctor
- Dedicated doctor login
- Dashboard showing today's queue/bookings
- Update or clear available time slots, which automatically recalculates patient capacity and triggers notification emails for affected patients

### 🛡️ Admin
- Separate admin login (credentials configured via environment variables)
- Dashboard with an overview of all doctors and bookings
- Add, edit, or delete doctors (name, sector, time slot, max capacity, average consultation time)

### ⚙️ Core Logic
- Queue position and estimated appointment time are computed from each doctor's time slot and average consultation time
- A unique index on `(doctorName, appointmentTime)` prevents double-booking the same time slot

## 🧰 Tech Stack

| Layer            | Technology |
|-------------------|------------|
| Runtime            | Node.js |
| Web framework      | Express.js |
| Templating         | EJS |
| Database           | MongoDB with Mongoose |
| Auth               | express-session + bcryptjs |
| File uploads       | Multer (local disk in dev, Cloudinary in production) |
| Email notifications| Resend |
| Dev tooling        | Nodemon |

## 📂 Project Structure

```
.
├── app.js                  # App entry point — Express setup, sessions, routes, DB connection
├── controllers/            # Route logic for admin, auth, client, and doctor flows
├── middleware/
│   └── auth.js              # requireClient / requireAdmin route guards
├── models/                  # Mongoose schemas: User, Doctor, Booking
├── routes/                  # Express routers: landing, auth, client, doctor, admin
├── utils/
│   └── email.js              # Resend email templates & senders (reschedule, cancellation, urgent changes)
├── views/
│   ├── pages/                 # EJS pages (landing, login/signup, dashboards, profile, error)
│   └── partials/              # Shared EJS partials (head, navbar, scripts)
└── public/                  # Static assets (CSS, JS, images)
```

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- A [MongoDB](https://www.mongodb.com/) instance (local or Atlas)
- A [Resend](https://resend.com/) API key (for email notifications)
- A [Cloudinary](https://cloudinary.com/) account (only needed for file uploads in production)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/juliej0hn/Hospital-Management-System.git
   cd Hospital-Management-System
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root with the following variables:
   ```env
   # Server
   PORT=3000
   ENVIRONMENT=development          # set to "production" to enable secure cookies & Cloudinary uploads

   # Database
   MONGODB_URI=mongodb://localhost:27017/hayat

   # Sessions
   SESSION_SECRET=your-session-secret

   # Admin login
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin123

   # Email (Resend)
   RESEND_API_KEY=your-resend-api-key

   # File uploads (Cloudinary — required only in production)
   CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
   ```

4. Start the server
   ```bash
   npm start
   ```
   Or, for development with auto-reload:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 Default Routes

| Route             | Description |
|--------------------|-------------|
| `/`                 | Landing page |
| `/auth`             | Patient login / sign up |
| `/client/dashboard` | Patient dashboard (requires login) |
| `/doctor/login`     | Doctor login |
| `/doctor/dashboard` | Doctor dashboard |
| `/admin/login`      | Admin login |
| `/admin/dashboard`  | Admin dashboard |

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to open an issue or submit a pull request.
