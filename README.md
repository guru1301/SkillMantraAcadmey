# Skill Mantra Academy - Web Platform

Institutional Training, Corporate Upskilling, and Academic Management Portal built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **Neon PostgreSQL**.

---

## 🚀 Quick Start for Developers

### 1. Prerequisites
- **Node.js**: v18.18.0 or newer (v20+ recommended)
- **npm**: v9+ (comes with Node.js)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory by copying `.env.example`:
```bash
# Windows PowerShell:
Copy-Item .env.example .env.local

# macOS / Linux / Git Bash:
cp .env.example .env.local
```

### 4. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Database & Cloud Notice for Team Development

> **Note for Collaborators:**  
> Live production database credentials (`DATABASE_URL`) are strictly isolated and not shared in this codebase to protect live production records and prevent accidental data overwrites.

- **Frontend & UI Development**:  
  You **do not need a database connection** to work on landing pages, components, layouts, styles, or static views (`/`, `/about`, `/contact`, `/programs`, etc.). Simply run `npm run dev`.

- **Admin & Portal Backend Development**:  
  If you are developing or testing database-backed features (e.g. `/admin`, `/portal`):
  1. Create a free isolated database branch on [Neon](https://neon.tech) or spin up a local PostgreSQL database.
  2. Put your connection string in `.env.local`:
     ```env
     DATABASE_URL="postgresql://user:password@localhost:5432/skillmantra"
     AUTH_SECRET="your-32-character-secret-key-for-local-testing"
     ```
  3. Initialize your isolated database tables and demo seed data:
     ```bash
     npm run db:setup
     npm run db:seed-demo
     ```

---

## 🛠 Available Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Runs the Next.js development server at `localhost:3000` |
| `npm run build` | Builds production-optimized bundle |
| `npm run start` | Runs the production build locally |
| `npm run lint` | Runs ESLint check |
| `npm run db:setup` | Runs migrations & seeds initial super admin on your DB |
| `npm run db:seed-demo` | Seeds demo colleges, programs, trainers & batches |

---

## 📁 Key Directories

- `src/app/` — Next.js App Router pages and layouts
- `src/components/` — UI components (sections, layouts, admin modules)
- `src/lib/` — Helper utilities, validation schemas, and database query handlers
- `src/db/` — Database migrations and seed scripts
- `public/` — Static assets and images

