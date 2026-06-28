# Shaheen Badminton Club Portal

A full-stack club management platform with public website and admin panel.

## Project Structure

```
shaheenbadmintonclub/
├── backend/     # Node.js + Express + MongoDB API
└── frontend/    # React + Vite web app
```

## Quick Start (Local Development)

### 1. Backend
```bash
cd backend
# Fill in your .env (copy from .env.example and add the MongoDB password)
npm install
npm run seed     # Creates the admin account (run once)
npm run dev      # Starts on http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev      # Starts on http://localhost:5173
```

### 3. Open Browser
- Public site: http://localhost:5173
- Admin panel: http://localhost:5173/admin/login

Default admin credentials (set in backend/.env):
- **Username**: `admin`
- **Password**: `shaheen2024`

## Deployment

### Backend → Render
1. Push `backend/` to GitHub
2. Connect repo to [render.com](https://render.com)
3. Add all environment variables from `backend/.env` in Render dashboard
4. Deploy

### Frontend → Vercel
1. Push `frontend/` to GitHub
2. Connect to [vercel.com](https://vercel.com)
3. Set `VITE_API_BASE_URL` = your Render backend URL + `/api`
4. Deploy

## Tech Stack
- **Frontend**: React 18 + Vite + React Router + Axios + date-fns
- **Backend**: Node.js + Express + Mongoose
- **Database**: MongoDB Atlas
- **Auth**: JWT (admin only)
- **Images**: Cloudinary v2
- **Deploy**: Vercel (frontend) + Render (backend) + MongoDB Atlas
