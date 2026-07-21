<div align="center">

# 🔒 LockDrop

**Secure File Sharing Without Accounts**

Upload a file, folder, or a batch of files, protect it with a password and an expiry, then share the password. No sign up, no login, no accounts — ever.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=for-the-badge)](https://mylockdrop.vercel.app)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Made with React](https://img.shields.io/badge/frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Made with Node](https://img.shields.io/badge/backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)

[🔗 Live Site](https://mylockdrop.vercel.app) · [🐞 Report a Bug](https://github.com/atanudas18/LockDrop/issues) · [✨ Request a Feature](https://github.com/atanudas18/LockDrop/issues)

</div>

---

## 📑 Table of Contents

| | | |
|---|---|---|
| [✨ Features](#-features) | [🧰 Tech Stack](#-tech-stack) | [📂 Project Structure](#-project-structure) |
| [⚙️ How It Works](#️-how-it-works) | [🚀 Local Setup](#-local-setup) | [☁️ Deployment](#️-deployment) |
| [🔑 Environment Variables](#-environment-variables) | [📡 API Reference](#-api-reference) | [🛡️ Security Notes](#️-security-notes) |

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 Password Protection | Every upload is locked behind a password — hashed with bcrypt, never stored in plain text |
| 📁 Folder Uploads | Drag & drop an entire folder — it's zipped securely on the backend |
| ⏳ Auto-Expiry | Set an expiry (1 hour → custom date); files self-destruct automatically |
| 🙈 No Accounts | No sign up, no login — the password itself is the access key |
| ⚡ Fast & Lightweight | React + Vite frontend, Express backend, zero bloat |
| 🧹 Auto-Cleanup | A cron job sweeps expired files every 5 minutes — nothing lingers |

---

## 🧰 Tech Stack

<div align="center">

| Layer | Stack |
|---|---|
| **Frontend** | ![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black) ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?logo=tailwindcss&logoColor=white) ![Framer Motion](https://img.shields.io/badge/Framer_Motion-black?logo=framer&logoColor=white) |
| **Backend** | ![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white) ![Express](https://img.shields.io/badge/Express-black?logo=express&logoColor=white) ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white) |
| **Storage / Infra** | ![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?logo=cloudinary&logoColor=white) ![Vercel](https://img.shields.io/badge/Vercel-black?logo=vercel&logoColor=white) ![Render](https://img.shields.io/badge/Render-46E3B7?logo=render&logoColor=white) |

</div>

---

## 📂 Project Structure

```
lockdrop/
├── backend/
│   ├── config/          # MongoDB + Cloudinary connection setup
│   ├── models/          # Upload.js mongoose schema
│   ├── middleware/      # rate limiting, error handling
│   ├── routes/          # upload.js, verify.js, download.js
│   ├── utils/           # sanitize, zip, cron cleanup
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── api/          # axios instance
│   │   ├── components/   # Navbar, Footer, Puppy, GradientBackground, ProgressBar
│   │   ├── pages/         # Home, Upload, Download
│   │   └── App.jsx
│   ├── public/            # favicon, og-image, apple-touch-icon
│   ├── index.html
│   └── vercel.json
└── README.md
```

---

## ⚙️ How It Works

1. **Upload** — pick a file, multiple files, or a whole folder (folders are zipped securely on the backend using `archiver`), set a password and an expiry, and upload. The password is hashed with bcrypt before it ever touches the database.
2. **Download** — anyone with the password opens `/download`, enters it, and if it matches an active upload, sees the file's metadata (name, size, type, upload date, expiry, download count) with a button to download.
3. **Auto-delete** — a `node-cron` job sweeps every 5 minutes for uploads past their `expiresAt`, deletes the asset from Cloudinary, then removes the MongoDB document.

> Because there are no user accounts, the **password itself is the lookup key** — `/verify` checks the submitted password against all active (non-expired) uploads' bcrypt hashes to find a match.

---

## 🚀 Local Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# fill in MONGO_URI, CLOUDINARY_* credentials in .env
npm run dev
```
Runs on `http://localhost:5000`

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL should point at your backend, e.g. http://localhost:5000
npm run dev
```
Runs on `http://localhost:5173`

<details>
<summary>📦 MongoDB Atlas Setup</summary>

1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user and allow network access (or `0.0.0.0/0` for testing)
3. Copy the connection string into `backend/.env` as `MONGO_URI`

</details>

<details>
<summary>☁️ Cloudinary Setup</summary>

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. From the dashboard, copy `Cloud Name`, `API Key`, and `API Secret`
3. Put them into `backend/.env` as `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

</details>

---

## ☁️ Deployment

| | Platform | Steps |
|---|---|---|
| **Backend** | Render | Push to GitHub → New Web Service → root `backend/` → Build: `npm install` → Start: `npm start` → add env vars → set `CLIENT_URL` to your frontend URL |
| **Frontend** | Vercel | New Project → root `frontend/` → Framework: Vite → add `VITE_API_URL` env var → Deploy |

---

## 🔑 Environment Variables

**`backend/.env`**
```env
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-frontend.vercel.app
MONGO_URI=mongodb+srv://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
LOCKDROP_SECRET=...
```

**`frontend/.env`**
```env
VITE_API_URL=https://your-backend.onrender.com
```

---

## 📡 API Reference

| Method | Route | Description |
|---|---|---|
| `POST` | `/upload` | multipart form: `files`, `password`, `expiry`, optional `customDate`, `isFolder`, `folderName` |
| `POST` | `/verify` | JSON `{ password }` → returns file metadata + an id |
| `GET` | `/download/:id` | streams the file, increments `downloadCount` |
| `GET` | `/health` | health check |

> Expired files are swept automatically every 5 minutes — no dedicated delete endpoint is exposed publicly.

---

## 🛡️ Security Notes

- ✅ Helmet sets secure HTTP headers; CORS is locked to `CLIENT_URL`
- ✅ Separate, stricter rate limits on `/upload` and `/verify` to slow abuse/brute-force
- ✅ Filenames are sanitized (basename-only, character allowlist) to prevent directory traversal
- ✅ Passwords are bcrypt-hashed — never logged, never stored in plain text
- ✅ Password lookup only compares against *active* (non-expired) uploads

---

<div align="center">

Made with ❤️ by **Atanu Das**

[![GitHub](https://img.shields.io/badge/GitHub-atanudas18-181717?style=flat-square&logo=github)](https://github.com/atanudas18)

</div>