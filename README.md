# 🏥 Hospify - Comprehensive Hospital Management System

> **Streamlining Healthcare Operations, One Click at a Time.**

![Project Status](https://img.shields.io/badge/Status-Active_Development-green?style=for-the-badge)

## �📖 Introduction

**Hospify** is a robust and modern Hospital Management System designed to digitize and optimize hospital workflows. It provides a seamless experience for administrators, doctors, staff, and patients by integrating essential services such as patient registration, appointment scheduling, telemedicine, pharmacy management, and billing into a single unified platform.

With a focus on user experience and real-time data, Hospify ensures that healthcare providers can focus on what matters most—patient care.

## ✨ Key Features

### 🧑‍⚕️ For Doctors
*   **Dashboard**: Real-time overview of appointments, patients, and tasks.
*   **Appointment Management**: View, reschedule, or cancel appointments. Manage patient queues effectively.
*   **Patient Records (EMR)**: Access comprehensive electronic medical records, including history, detailed notes, and prescriptions.
*   **Telemedicine**: Conduct secure video consultations with patients using WebRTC integration.
*   **Chat with Patients**: Secure, real-time messaging for follow-ups and queries.
*   **Document Management**: Upload and manage medical documents (PDF, Images) securely.
*   **Profile Management**: Update professional details, availability, and specialty.

### 🏥 For Hospital Operations (Admin & Staff)
*   **Role-Based Access Control (RBAC)**: secure panels for:
    *   **Admin**: Total system control, user management (doctors, staff, patients), department, and settings management.
    *   **Nurse/Receptionist**: Patient registration, vital signs checks, appointment booking, and queue management.
    *   **Pharmacist**: Manage medicine inventory, track expiry dates, and handle prescription dispensaries.
    *   **Lab Technician**: Manage lab test requests, track samples, and upload results.
*   **Billing & Invoicing**: Automated invoice generation for consultations, tests, and pharmacy, integrated with **Razorpay**.
*   **Inventory Management**: Real-time tracking of medicines and hospital resources.
*   **Analytics**: Visual dashboards for hospital performance, patient footfall, and revenue.
*   **Audit Logs**: detailed logs of critical system actions for security and compliance.

### 👤 For Patients
*   **Patient Portal**: Dashboard to view upcoming appointments, medical history, and bills.
*   **Book Appointments**: Easy scheduling for in-person or video consultations with preferred doctors.
*   **Telemedicine**: Join video calls directly from the browser without external apps.
*   **Medical History**: Access past prescriptions, lab reports, and diagnosis history.
*   **Real-time Chat**: Communicate with assigned doctors.
*   **Health Tracking**: Monitor vital signs trends over time.

## 🛠️ Tech Stack

### Frontend (`my-hospital-app`)
*   **Framework**: Next.js 14 (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS, Shadcn UI
*   **Animations**: Framer Motion
*   **State/Data**: React Hooks, Context API
*   **Real-time**: Socket.io Client
*   **Media**: Cloudinary (Image/File Uploads)
*   **Icons**: Lucide React, React Icons

### Backend (`backend`)
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database**: PostgreSQL (via Supabase)
*   **Authentication**: Supabase Auth (JWT)
*   **Real-time**: Socket.io Server
*   **File Storage**: Cloudinary
*   **Payments**: Razorpay
*   **Email**: Nodemailer
*   **Cron Jobs**: node-cron (for reminders)
*   **Validation**: express-validator

## � API Endpoints

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/register` | Register a new user (Patient, Doctor, Staff, Admin) |
| `POST` | `/login` | Login and receive JWT token |

### 🏥 Admin (`/api/admin`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/stats` | Dashboard statistics (users, revenue) |
| `GET` | `/profile` | Get admin profile details |
| `GET` | `/doctors` | List all doctors (with user details) |
| `POST` | `/doctors` | Register a new doctor |
| `PUT` | `/doctors/:id` | Update doctor details |
| `DELETE` | `/doctors/:id` | Remove a doctor |
| `GET` | `/staff` | List all staff members |
| `PUT` | `/staff/:staffId` | Update staff details |
| `GET` | `/patients` | List all patients |
| `GET` | `/departments` | List hospital departments |
| `POST` | `/departments` | Create a new department |
| `PUT` | `/departments/:id` | Update department details |
| `DELETE` | `/departments/:id` | Delete a department |
| `GET` | `/analytics/revenue` | Revenue analytics (by date/dept) |
| `GET` | `/analytics/patients` | Patient analytics |
| `GET` | `/logs` | System audit logs |
| `GET` | `/tickets` | View support tickets & feedback |
| `PUT` | `/settings` | Update system settings (hospital name, fees) |

### 👨‍⚕️ Doctor (`/api/doctor`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/profile` | Get doctor profile & availability |
| `PUT` | `/profile` | Update profile information |
| `GET` | `/appointments` | View scheduled appointments |
| `PATCH` | `/appointments/:id/complete` | Mark appointment as completed |
| `POST` | `/emr` | Create EMR record (Diagnosis, Rx) |
| `GET` | `/patient-emrs/:patientId` | View patient's EMR history |
| `POST` | `/upload/document` | Upload medical documents (PDF/Image) |
| `GET` | `/chat/patients` | List patients for chat |

### 👤 Patient (`/api/patient`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/profile` | Get patient profile details |
| `PUT` | `/profile` | Update profile details |
| `GET` | `/appointments/upcoming` | View all appointments (In-person, Virtual, Home) |
| `POST` | `/appointments` | Book an in-person appointment |
| `PATCH` | `/appointments/:type/:id/cancel` | Cancel an appointment |
| `PATCH` | `/appointments/:type/:id/reschedule` | Reschedule an appointment |
| `GET` | `/medical-history` | View EMR records |
| `GET` | `/lab-results` | View lab test results |
| `GET` | `/billing` | View billing history |
| `POST` | `/billing/create-order` | Initiate Razorpay payment |
| `POST` | `/billing/verify-payment` | Verify Razorpay payment |
| `GET` | `/prescriptions` | View prescriptions |
| `GET` | `/chat/doctors` | List doctors for chat |
| `GET` | `/chat/appointments` | Get appointments for chat context |
| **Inpatient/Outpatient** | | |
| `GET` | `/inpatients` | View inpatient records (Admissions) |
| `GET` | `/outpatients` | View outpatient records |
| `POST` | `/outpatients/book` | Book outpatient visit |

### 💊 Staff (`/api/staff`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/profile` | Get staff profile details |
| **Receptionist** | | |
| `GET` | `/appointments/today` | View all appointments for today |
| `PATCH` | `/appointments/:id/status` | Update status (Check-in/No-show) |
| `POST` | `/register-patient` | Register new patient (Walk-in) |
| **Pharmacist** | | |
| `GET` | `/pharmacy/inventory` | View medicine inventory |
| `POST` | `/pharmacy/inventory` | Add medicine to stock |
| `GET` | `/pharmacy/pending` | View pending prescriptions |
| `POST` | `/pharmacy/dispense` | Dispense medicine & bill |
| **Laboratorist** | | |
| `GET` | `/lab/tests` | List available lab tests |
| `GET` | `/lab/requests` | View pending test requests |
| `POST` | `/lab/results/:id` | Upload test results |

### 🏠 Home Visits (`/api/home-visit`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/` | Book a home visit |
| `GET` | `/` | List home visits |
| `PATCH` | `/:id` | Update visit status |
| `POST` | `/create-bill` | Generate bill for home visit |

### 📹 Telemedicine (`/api/public/video`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/room/:id` | Check video room status |
| `POST` | `/invite` | Send email invite for video call |
| `POST` | `/room/:id/offer` | WebRTC Signaling (Offer) |
| `POST` | `/room/:id/answer` | WebRTC Signaling (Answer) |

### 🌐 Public & Utility
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/doctors` | Public list of doctors |
| `GET` | `/api/dashboard` | Dashboard status check |
| `POST` | `/api/utils/feedback` | Submit feedback |
| `POST` | `/api/utils/support` | Submit support ticket |
| `POST` | `/api/notifications/home-visit`| Send home visit email notifications |

## 🚀 Installation & Setup

### Prerequisites
*   **Node.js** (v18+)
*   **npm** or **yarn**
*   **Git**
*   **PostgreSQL** (or Supabase project)

### 1. Clone the Repository
```bash
git clone https://github.com/Karthikchakala/HospitalManagement.git
cd HospitalManagement
```

### 2. Setup Frontend (`my-hospital-app`)
```bash
cd my-hospital-app
npm install
```

Create a `.env.local` file in `my-hospital-app` and add:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BACKEND_BASE_URL=http://localhost:5000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Setup Backend (`backend`)
Open a new terminal and navigate to the backend folder:
```bash
cd backend
npm install
```

Create a `.env` file in `backend`. **Required Variables:**
```env
# Server Configuration
PORT=5000
FRONTEND_BASE=http://localhost:3000

# Database (Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Authentication (JWT)
JWT_SECRET=your_jwt_secret

# File Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email Service (SMTP)
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
MAIL_FROM=your_email_from_address
```

### 4. Run the Application

**Start Frontend:**
```bash
# In my-hospital-app/
npm run dev
```

**Start Backend:**
```bash
# In backend/
npm start
```

Visit `http://localhost:3000` to view the application.



## 📂 Project Structure

```bash
HMS-main_2/
├── 📂 my-hospital-app/           # Frontend (Next.js)
│   ├── 📂 src/
│   │   ├── 📂 app/               # App Router
│   │   │   ├── 📂 api/           # Internal API Routes
│   │   │   ├── 📂 dashboard/     # Protected Dashboard Pages
│   │   │   │   ├── 📂 admin/     # Admin View
│   │   │   │   ├── 📂 doctor/    # Doctor View
│   │   │   │   ├── 📂 patient/   # Patient View
│   │   │   │   └── 📂 staff/     # Staff View
│   │   │   ├── 📂 login/         # Auth Pages
│   │   │   └── page.tsx          # Landing Page
│   │   ├── 📂 components/        # UI Components
│   │   │   ├── 📂 analytics/     # Analytics Charts
│   │   │   ├── AnimatedSplitText.tsx
│   │   │   ├── BubbleBackground.tsx
│   │   │   ├── CallbackWidget.tsx
│   │   │   ├── DashboardNavbar.tsx
│   │   │   ├── Departments.tsx
│   │   │   ├── DoctorChatWidget.tsx
│   │   │   ├── EventsCarousel.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── HospifyChatbot.tsx
│   │   │   ├── HospitalPopup.tsx
│   │   │   ├── Map.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── NewsCarousel.tsx
│   │   │   ├── ParticlesBackground.tsx
│   │   │   ├── PatientChatWidget.tsx
│   │   │   ├── RealtimeChatWidget.tsx
│   │   │   └── SignupBoxes.tsx
│   │   ├── 📂 lib/               # Utilities
│   │   │   ├── supabaseClient.ts
│   │   │   └── supabaseServer.ts
│   ├── public/                   # Static Assets
│   ├── .env.local                # Frontend Env Vars
│   └── package.json
│
├── 📂 backend/                   # Backend (Node.js/Express)
│   ├── 📂 controllers/           # Business Logic
│   │   └── authController.ts
│   ├── 📂 routes/                # API Endpoints
│   │   ├── 📂 admin/             # Admin Routes
│   │   ├── 📂 doctor/            # Doctor Routes
│   │   ├── 📂 patient/           # Patient Routes
│   │   ├── 📂 staff/             # Staff Routes
│   │   ├── 📂 public/            # Public Routes
│   │   └── authRoutes.ts
│   ├── 📂 middleware/            # Custom Middleware
│   │   └── authMiddleware.ts
│   ├── 📂 mailer/                # Email Service
│   ├── 📂 jobs/                  # Cron Jobs
│   ├── 📂 sockets/               # Socket.io Logic
│   ├── server.ts                 # Server Entry Point
│   ├── .env                      # Backend Env Vars
│   └── package.json
│
└── README.md                     # Documentation
```

## 🔮 Future Enhancements

*   [ ] **AI Symptom Checker**: Integrate AI for preliminary diagnosis.
*   [ ] **Mobile App**: React Native version for iOS and Android.
*   [ ] **Advanced Analytics**: Detailed predictive reports for hospital administration.
*   [ ] **Multi-Language Support**: i18n integration for global accessibility.
*   [ ] **Insurance Integration**: Direct claim processing.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

Made with ❤️ by [Karthik Chakala](https://github.com/Karthikchakala)
