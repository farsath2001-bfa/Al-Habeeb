# Al Habeeb Construction & Engineering

Company website with interactive 3D visuals.

| Part | Technology | Deployed on |
|------|-----------|-------------|
| `frontend/` | React + Vite, **Tailwind CSS v4**, Three.js (react-three-fiber) | Vercel (free) |
| `backend/`  | Node.js + Express REST API | Render (free) |
| Database    | **PostgreSQL** (Docker locally, Neon in the cloud) | Neon (free) |

```
al-habeeb/
├── docker-compose.yml        <- PostgreSQL (+ Adminer, + optional API) for local work
├── render.yaml               <- Render setup for the backend
├── backend/
│   ├── db/init.sql           <- tables + starter data (services, projects, inquiries)
│   ├── src/server.js         <- Express app (CORS, security headers, routes)
│   ├── src/routes/api.js     <- /api/services, /api/projects, /api/inquiries, /api/health
│   ├── src/db.js             <- PostgreSQL connection pool
│   ├── src/migrate.js        <- `npm run db:init`
│   └── Dockerfile
└── frontend/
    ├── public/images/        <- logo + your pictures (put more construction photos here)
    ├── vercel.json
    └── src/
        ├── three/            <- 3D: parts.jsx (tower, crane, city), HeroScene, ShowcaseScene
        ├── components/       <- Navbar, Footer, ProjectCard, Scene3D
        ├── pages/            <- Home.jsx, Projects.jsx
        ├── data/site.js      <- company name, contact details, fallback data  (EDIT ME)
        └── lib/              <- api.js (fetch helpers), useApi.js
```

---

## Part 1 - Run it on your computer

You need: **Node.js 20+** (nodejs.org, LTS) and **Docker Desktop** (docker.com) - Docker is only for the database.
Check with `node -v` and `docker -v`.

### Step 1 - Start PostgreSQL with Docker
```bash
cd al-habeeb
docker compose up -d db
```
First time it downloads Postgres (~1-2 minutes), then creates the database `habeeb` and runs `backend/db/init.sql` automatically.

Check it: `docker compose ps` should show `habeeb-db` as *healthy*.
Optional table viewer: `docker compose --profile tools up -d`, then open http://localhost:8080
(System: PostgreSQL, Server: `db`, User: `habeeb`, Password: `habeeb_dev_pw`, Database: `habeeb`).

### Step 2 - Start the backend
```bash
cd backend
copy .env.example .env        # Windows   (Mac/Linux: cp .env.example .env)
npm install
npm run dev
```
Open http://localhost:5000/api/health -> `{"status":"ok","database":"connected"}`
Also try http://localhost:5000/api/services and http://localhost:5000/api/projects

### Step 3 - Start the frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 - you should see the tower build itself in the hero.
Fill in the contact form: the message is saved in PostgreSQL. Read it with:
```bash
curl -H "x-admin-key: change-me" http://localhost:5000/api/inquiries
```

> Docker Desktop is heavy on an older laptop. If it is too slow, you can skip Docker and use a free
> Neon database even for development: put its connection string in `backend/.env`
> (`DATABASE_URL=...` and `DATABASE_SSL=true`) and run `npm run db:init` once.

---

## Part 2 - How this project was created from scratch (the commands, in order)

1. **Folders**
   ```bash
   mkdir al-habeeb && cd al-habeeb
   mkdir backend
   ```
2. **Frontend with Vite** (React template)
   ```bash
   npm create vite@latest frontend -- --template react
   cd frontend
   npm install
   ```
3. **Tailwind CSS v4** (no config file needed any more)
   ```bash
   npm install tailwindcss @tailwindcss/vite
   ```
   - `vite.config.js`: add `import tailwindcss from '@tailwindcss/vite'` and put `tailwindcss()` in `plugins`.
   - `src/index.css`: first line `@import "tailwindcss";`
   - Brand colours live in `@theme { ... }` in `src/index.css`, so `bg-navy-800`, `text-gold-500` just work.
4. **3D + routing**
   ```bash
   npm install three @react-three/fiber @react-three/drei react-router-dom
   ```
   `@react-three/fiber` currently needs React below 19.3, so this project pins `react` and `react-dom` to `19.2.8`
   (`npm install react@19.2.8 react-dom@19.2.8`). If you see an `ERESOLVE` error, that is the reason.
5. **Backend**
   ```bash
   cd ../backend
   npm init -y
   npm install express pg cors helmet dotenv express-rate-limit
   npm install -D nodemon
   ```
   In `package.json` add `"type": "module"` and the scripts `start`, `dev`, `db:init`.
6. **Database** - `docker-compose.yml` at the root + `backend/db/init.sql` (tables and starter rows).
7. **Connect** - in dev, `vite.config.js` forwards `/api` to `http://localhost:5000`, so the frontend just calls `fetch('/api/services')`.

Ideas for learning, in a good order: change colours in `index.css` -> edit text in `data/site.js` ->
add a project row in `init.sql` (or in Adminer) -> tweak the tower in `three/parts.jsx` (change `TOTAL_FLOORS`, colours).

---

## Part 3 - Deploy for free (Neon + Render + Vercel)

Order matters: **database -> backend -> frontend -> tell the backend the frontend address**.

> Why Neon and not Render's own Postgres? Render's free Postgres expires after 30 days.
> Also give this project its **own** database - don't share one with other client projects.

### A. Database on Neon
1. neon.com -> sign up -> **New Project** -> name `al-habeeb`.
2. Copy the **connection string** (looks like `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`).

### B. Backend on Render
1. Push the whole `al-habeeb` folder to a GitHub repository.
2. render.com -> **New +** -> **Blueprint** -> pick the repo (it reads `render.yaml`).
   *(Or **New + -> Web Service** with Root Directory `backend`, Build `npm install`, Start `npm start`.)*
3. Set the environment variables:
   - `DATABASE_URL` = the Neon connection string
   - `DATABASE_SSL` = `true`
   - `CLIENT_URL` = your Vercel address (put a temporary value now, fix in step D)
   - `AUTO_MIGRATE` = `true` (creates the tables on first start)
4. Deploy. Open `https://YOUR-SERVICE.onrender.com/api/health`.
   The free plan sleeps when idle, so the first request after a break can take a minute -
   the website shows built-in fallback content meanwhile, so it never looks empty.

### C. Frontend on Vercel
1. vercel.com -> **Add New -> Project** -> import the same repo.
2. **Root Directory**: `frontend` (Framework: Vite is detected automatically).
3. **Environment Variable**: `VITE_API_URL` = `https://YOUR-SERVICE.onrender.com` (no trailing slash).
4. Deploy.

### D. Final link
Go back to Render -> `CLIENT_URL` = your real Vercel address (`https://xxxx.vercel.app`, no trailing slash) -> save (it redeploys).
Test the contact form on the live site.

---

## Adding more pictures and real 3D models
- **Photos**: copy them into `frontend/public/images/` and add a row to `projects` (`image_url` = `/images/your-photo.jpg`).
  Free stock sources for construction photos: Unsplash, Pexels. Check the licence before using them for a client.
- **Real 3D models** (from Revit/SketchUp/Blender): export as `.glb`, put it in `frontend/public/models/`, load with
  drei's `useGLTF('/models/tower.glb')` and replace `<Tower />` in `ShowcaseScene.jsx`.

## Things to replace before going live
`frontend/src/data/site.js` (email, phone, website, established year), the placeholder project in `init.sql`,
and the `ADMIN_KEY` value.
