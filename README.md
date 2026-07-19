# LockDrop

**Secure File Sharing Without Accounts**

Upload a file, folder, or a batch of files, protect it with a password and an
expiry, then share the password. No sign up, no login, no accounts — ever.

## Tech Stack

- **Frontend:** React + Vite, Tailwind CSS, Framer Motion, React Router, Axios, react-hot-toast
- **Backend:** Node.js, Express, MongoDB (Atlas), Cloudinary, Multer, Archiver, Helmet, CORS, express-rate-limit, bcrypt, node-cron
- **Deploy:** Frontend → Vercel · Backend → Render · DB → MongoDB Atlas · Storage → Cloudinary

## Project Structure

```
lockdrop/
  backend/
    config/          # MongoDB + Cloudinary connection setup
    models/          # Upload.js mongoose schema
    middleware/       # rate limiting, error handling
    routes/           # upload.js, verify.js, download.js
    utils/            # sanitize, zip, cron cleanup
    server.js
  frontend/
    src/
      api/            # axios instance
      components/     # Navbar, Footer, Puppy, GradientBackground, ProgressBar
      pages/           # Home, Upload, Download
      App.jsx
    index.html
  README.md
  .env.example (see backend/ and frontend/ for the actual files)
```

## How It Works

1. **Upload** — pick a file, multiple files, or a whole folder (folders are
   zipped securely on the backend using `archiver`),
   set a password and an expiry, and upload. The password is hashed with
   bcrypt before it ever touches the database — never stored in plain text.
2. **Download** — anyone with the password opens `/download`, enters it, and
   if it matches an active upload, sees the file's metadata (name, size,
   type, upload date, expiry, download count) with a button to download.
3. **Auto-delete** — a `node-cron` job sweeps every 5 minutes for uploads
   past their `expiresAt`, deletes the asset from Cloudinary, then removes
   the MongoDB document. No manual cleanup required.

Because there are no user accounts, the **password itself is the lookup
key** — `/verify` checks the submitted password against all active
(non-expired) uploads' bcrypt hashes to find a match. At upload time, the
same check enforces password uniqueness across active uploads.

## Local Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# fill in MONGO_URI, CLOUDINARY_* credentials in .env
npm run dev
```

Backend runs on `http://localhost:5000` by default.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL should point at your backend, e.g. http://localhost:5000
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

## MongoDB Atlas Setup

1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Create a database user and allow network access (or `0.0.0.0/0` for testing)
3. Copy the connection string into `backend/.env` as `MONGO_URI`, replacing
   the username/password placeholders, and set a database name (e.g. `lockdrop`)

## Cloudinary Setup

1. Create a free account at https://cloudinary.com
2. From the dashboard, copy `Cloud Name`, `API Key`, and `API Secret`
3. Put them into `backend/.env` as `CLOUDINARY_CLOUD_NAME`,
   `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
4. Files are uploaded as `resource_type: raw` under the `lockdrop/` folder

## Deployment

### Backend → Render

1. Push this repo to GitHub
2. New Web Service on Render, point it at `backend/`
3. Build command: `npm install` · Start command: `npm start`
4. Add all variables from `backend/.env.example` in Render's environment settings
5. Set `CLIENT_URL` to your deployed frontend URL (for CORS)

### Frontend → Vercel

1. New Project on Vercel, point it at `frontend/`
2. Framework preset: Vite
3. Add `VITE_API_URL` env var pointing to your Render backend URL
4. Deploy

## Environment Variables

**backend/.env**
```
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
```

**frontend/.env**
```
VITE_API_URL=https://your-backend.onrender.com
```

## API Reference

| Method | Route             | Description                                                |
|--------|-------------------|--------------------------------------------------------------|
| POST   | `/upload`         | multipart form: `files`, `password`, `expiry`, optional `customDate`, `isFolder`, `folderName` |
| POST   | `/verify`         | JSON: `{ password }` → returns file metadata + an id        |
| GET    | `/download/:id`   | streams the file, increments `downloadCount`                |
| GET    | `/health`         | health check                                                 |

Expired files are swept automatically every 5 minutes — no dedicated delete
endpoint is exposed publicly.

## Security Notes

- Helmet sets secure HTTP headers; CORS is locked to `CLIENT_URL`
- Separate, stricter rate limits on `/upload` and `/verify` to slow abuse/brute-force
- Filenames are sanitized (basename-only, character allowlist) to prevent
  directory traversal inside generated zip archives
- Passwords are validated for length and bcrypt-hashed (never logged, never
  stored in plain text)
- The password-uniqueness/lookup approach compares against all *active*
  uploads only — expired ones are excluded automatically once swept

## Notes on the Puppy Mascot

The mascot (`frontend/src/components/Puppy.jsx`) is built with emoji + CSS/
Framer Motion so the project runs with **zero external animation assets**.
It already exposes a `state` prop (`idle`, `covering`, `happy`, `sad`,
`jump`, `celebrate`) — swap the inner markup for a real `<Lottie
animationData={...} />` per state if you want richer animation; the wiring
in `Upload.jsx` and `Download.jsx` (focus → covering, success → happy/jump,
error → sad, download → celebrate) needs no changes.
