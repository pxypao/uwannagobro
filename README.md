# RallyBro

A community platform where people with an extra sports ticket can list it for free so they have a companion at the game.

## Project Structure

```
rallybro/
├── client/   # React (Vite) frontend
└── server/   # Node.js + Express backend
```

## Prerequisites

- Node.js 18+
- npm 9+

---

## Local Development

### 1. Clone & install dependencies

```bash
# Install server deps
cd server
npm install

# Install client deps
cd ../client
npm install
```

### 2. Configure environment

```bash
cd server
cp ../.env.example .env
# Edit .env and set a real JWT_SECRET
```

### 3. Seed the database

```bash
cd server
node db/seed.js
```

### 4. Run dev servers

**Terminal 1 — backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — frontend:**
```bash
cd client
npm run dev
```

The app will be at **http://localhost:5173**. The Vite dev server proxies `/api/*` to the Express server on port 3001.

---

## Deployment

### Backend (Render)

1. Set the following environment variables in your hosting dashboard:
   - `JWT_SECRET` — long random string
   - `PORT` — usually set automatically
   - `CLIENT_URL` — your Vercel frontend URL (e.g. `https://rallybro.com`)
2. Push the `server/` directory (or point to the monorepo root with build command `cd server && npm install && node db/seed.js`)
3. Start command: `node index.js`

> **Note:** SQLite stores `data.db` on disk. For persistent storage on Render, the DB path defaults to `/tmp/rallybro.db` in production. For permanent storage attach a persistent volume and set `DB_PATH` accordingly.

### Frontend (Vercel)

1. Import the repo into Vercel.
2. Set **Root Directory** to `client`.
3. Set environment variable `VITE_API_URL` to your backend URL.
4. Build command: `npm run build` | Output directory: `dist`.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, React Router v6 |
| Backend | Node.js, Express 4 |
| Database | SQLite via better-sqlite3 |
| Auth | JWT (localStorage + Authorization header) |
| Styling | Plain CSS (CSS variables, mobile-first) |
