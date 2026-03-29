# EduSpace — Full-Stack E-Learning Platform

A Google Classroom-inspired e-learning platform built with the **MERN stack** (MongoDB, Express, React, Node.js). Supports three user roles — Student, Teacher, and Admin — with JWT authentication, role-based authorization, file uploads, attendance tracking, assignments, grading, and more.

---

## 🚀 Features

### 👨‍🎓 Student
- Join classes using a class code
- View announcements and comment on them
- Submit assignments (with file attachments)
- View marks and teacher feedback
- Access study materials by topic
- View personal attendance history and percentage

### 👩‍🏫 Teacher
- Create and manage classes with auto-generated class codes
- Post announcements to the class stream
- Create assignments with due dates, marks, and file attachments
- View all student submissions and grade them with feedback
- Upload study materials (documents, videos, links) organized by topic
- Mark attendance for each class session and track history
- Regenerate class code at any time

### 👨‍💼 Admin
- Approve or reject teacher registrations
- Manage all users (activate, deactivate, delete)
- View all classes across the platform
- Delete any class
- Dashboard with platform-wide statistics

---

## 🛠 Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18 (Vite), React Router v6, Tailwind CSS |
| Backend    | Node.js, Express.js                             |
| Database   | MongoDB with Mongoose ODM                       |
| Auth       | JWT (jsonwebtoken) + bcryptjs                   |
| File Upload| Multer                                          |
| UI/UX      | Plus Jakarta Sans + Syne fonts, dark theme      |

---

## 📁 Folder Structure

```
elearning/
├── backend/
│   ├── middleware/
│   │   ├── auth.js          # JWT protect, authorize, requireApproved
│   │   └── upload.js        # Multer file upload config
│   ├── models/
│   │   ├── User.js
│   │   ├── Class.js
│   │   ├── Assignment.js
│   │   ├── Submission.js
│   │   ├── Material.js
│   │   ├── Attendance.js
│   │   └── Announcement.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── classes.js
│   │   ├── assignments.js
│   │   ├── submissions.js
│   │   ├── materials.js
│   │   ├── attendance.js
│   │   ├── announcements.js
│   │   └── admin.js
│   ├── uploads/             # Uploaded files (gitignored)
│   ├── .env.example
│   ├── seed.js              # Creates default admin account
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── common/       # LoadingSpinner
    │   │   └── layout/       # SidebarLayout
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── auth/         # Login, Register, RoleSelect
    │   │   ├── student/      # Dashboard, Class, Assignment, Materials, Attendance
    │   │   ├── teacher/      # Dashboard, Class, Assignments, Materials, Attendance, Submissions
    │   │   └── admin/        # Dashboard, Users, Classes
    │   ├── utils/
    │   │   └── api.js        # Axios instance with JWT interceptor
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

---

## 🔌 API Routes

### Auth — `/api/auth`
| Method | Route              | Access  | Description            |
|--------|--------------------|---------|------------------------|
| POST   | `/register`        | Public  | Register student/teacher |
| POST   | `/login`           | Public  | Login & receive JWT    |
| GET    | `/me`              | Private | Get current user       |
| PUT    | `/profile`         | Private | Update name/bio        |
| PUT    | `/change-password` | Private | Change password        |

### Classes — `/api/classes`
| Method | Route                       | Access       |
|--------|-----------------------------|--------------|
| POST   | `/`                         | Teacher      |
| POST   | `/join`                     | Student      |
| GET    | `/my`                       | All auth     |
| GET    | `/:id`                      | All auth     |
| PUT    | `/:id`                      | Teacher      |
| POST   | `/:id/regenerate-code`      | Teacher      |
| POST   | `/:id/leave`                | Student      |
| DELETE | `/:id/students/:studentId`  | Teacher      |

### Assignments — `/api/assignments`
| Method | Route                 | Access   |
|--------|-----------------------|----------|
| POST   | `/`                   | Teacher  |
| GET    | `/class/:classId`     | All auth |
| GET    | `/:id`                | All auth |
| PUT    | `/:id`                | Teacher  |
| DELETE | `/:id`                | Teacher  |

### Submissions — `/api/submissions`
| Method | Route                        | Access   |
|--------|------------------------------|----------|
| POST   | `/`                          | Student  |
| GET    | `/assignment/:assignmentId`  | Teacher  |
| GET    | `/my/:assignmentId`          | Student  |
| GET    | `/my-all/list`               | Student  |
| PUT    | `/:id/grade`                 | Teacher  |

### Materials — `/api/materials`
| Method | Route              | Access   |
|--------|--------------------|----------|
| POST   | `/`                | Teacher  |
| GET    | `/class/:classId`  | All auth |
| DELETE | `/:id`             | Teacher  |

### Attendance — `/api/attendance`
| Method | Route                         | Access   |
|--------|-------------------------------|----------|
| POST   | `/`                           | Teacher  |
| GET    | `/class/:classId`             | Teacher  |
| GET    | `/my/:classId`                | Student  |
| GET    | `/class/:classId/date/:date`  | Teacher  |

### Announcements — `/api/announcements`
| Method | Route               | Access   |
|--------|---------------------|----------|
| POST   | `/`                 | Teacher  |
| GET    | `/class/:classId`   | All auth |
| POST   | `/:id/comment`      | All auth |
| DELETE | `/:id`              | Teacher  |

### Admin — `/api/admin`
| Method | Route                      | Access |
|--------|----------------------------|--------|
| GET    | `/stats`                   | Admin  |
| GET    | `/users`                   | Admin  |
| PUT    | `/users/:id/approve`       | Admin  |
| PUT    | `/users/:id/deactivate`    | Admin  |
| PUT    | `/users/:id/activate`      | Admin  |
| DELETE | `/users/:id`               | Admin  |
| GET    | `/classes`                 | Admin  |
| DELETE | `/classes/:id`             | Admin  |
| GET    | `/pending-teachers`        | Admin  |

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/eduspace.git
cd eduspace
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create environment file
cp .env.example .env
# Edit .env with your values:
#   MONGODB_URI=your_mongodb_connection_string
#   JWT_SECRET=your_random_secret_key
#   FRONTEND_URL=http://localhost:5173

# Seed the admin account
node seed.js

# Start development server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Create environment file
cp .env.example .env
# Edit .env:
#   VITE_API_URL=http://localhost:5000/api

# Start dev server
npm run dev
```

### 4. Access the App
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Admin login: `admin@eduspace.com` / `admin123`

---

## 🌐 Deployment

### Frontend → Vercel / Netlify

**Vercel:**
```bash
cd frontend
npm run build
# Deploy via Vercel CLI or connect GitHub repo on vercel.com
# Set environment variable: VITE_API_URL=https://your-backend.onrender.com/api
```

**Netlify:**
```bash
cd frontend
npm run build
# Upload dist/ folder or connect GitHub
# Add _redirects file: /* /index.html 200
```

### Backend → Render / Railway

**Render:**
1. Create a new Web Service
2. Connect your GitHub repo
3. Root Directory: `backend`
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `FRONTEND_URL`
   - `NODE_ENV=production`

**Railway:**
```bash
cd backend
railway login
railway init
railway up
# Set environment variables in the Railway dashboard
```

### Database → MongoDB Atlas
1. Create a free cluster at mongodb.com/atlas
2. Create a database user with read/write access
3. Whitelist IP: `0.0.0.0/0` (for production)
4. Copy connection string into `MONGODB_URI`
5. Run `node seed.js` once to create the admin account

---

## 🔒 Environment Variables

### Backend (`.env`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/elearning
JWT_SECRET=super_secret_random_string_at_least_32_chars
JWT_EXPIRE=7d
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend (`.env`)
```env
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## 📌 Notes

- File uploads are stored locally in `backend/uploads/`. For production, consider using **AWS S3**, **Cloudinary**, or **Supabase Storage**.
- Teacher accounts require admin approval before they can create classes.
- Class codes are 7-character alphanumeric strings (e.g. `AB12C34`).
- The default admin account is created by running `node seed.js`.

---

## 📄 License

MIT License — free to use, modify, and distribute.
