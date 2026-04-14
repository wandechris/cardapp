# CardApp — Credit Card Transaction Viewer

A fullstack application that lets customers view and create transactions, and lets admins manage transaction states.

## Stack

- **Frontend** — React 19, TypeScript, Tailwind CSS v4, Vite
- **Backend** — Node.js, Express, TypeScript, JWT auth
- **Persistence** — JSON file (`backend/data/db.json`)

---

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher

---

## Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd cardapp
```

### 2. Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=3001
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

> `JWT_SECRET` can be any long random string. The server will refuse to start without it.

Seed the database with demo users and transactions:

```bash
npm run seed
```

Start the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:3001`.

---

### 3. Frontend

Open a new terminal tab:

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

> The frontend proxies all `/api` requests to `http://localhost:3001`, so both servers must be running.

---

## Demo Accounts

| Role     | Email                  | Password     |
|----------|------------------------|--------------|
| Admin    | admin@cardapp.com      | Admin1234!   |
| Customer | sarah@example.com      | Customer1!   |
| Customer | marcus@example.com     | Customer1!   |
| Customer | priya@example.com      | Customer1!   |

---

## Features

### Customer view (`/dashboard`)
- View your own transactions (date, merchant, amount, status)
- Filter by status (All / Pending / Posted / Reversed)
- Filter by date range
- Create a new transaction (simulates a purchase — starts as Pending)

### Admin view (`/admin`)
- View all transactions across all customers
- Filter by status, customer (searchable dropdown), and date range
- Reverse any Posted transaction (Pending and already-Reversed transactions cannot be reversed)

---

## Transaction States

```
PENDING → POSTED → REVERSED
```

Only `POSTED` transactions can be reversed. Attempting to reverse a `PENDING` or `REVERSED` transaction returns a `422` error.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | None | `{ email, password }` → `{ token, user }` |
| GET | `/api/transactions` | Customer JWT | Authenticated customer's transactions. Query: `status`, `from`, `to` |
| POST | `/api/transactions` | Customer JWT | Create a transaction. Body: `{ merchant, amount }` |
| GET | `/api/admin/transactions` | Admin JWT | All transactions. Query: `status`, `customer_id`, `from`, `to` |
| PATCH | `/api/admin/transactions/:id/reverse` | Admin JWT | Reverse a Posted transaction |
| GET | `/api/admin/users` | Admin JWT | List all customers |

---

## Running Tests

```bash
cd backend
npm test
```

Runs 36 integration tests covering auth, customer transactions, admin endpoints, and store error handling. Tests use an isolated database file and do not affect `data/db.json`.

---

## Project Structure

```
assesment/
├── backend/
│   ├── data/
│   │   └── db.json              # Runtime database (created by seed)
│   ├── src/
│   │   ├── server.ts            # Express app entry point
│   │   ├── store.ts             # readDb() / writeDb() file persistence
│   │   ├── seed.ts              # Demo data seeder
│   │   ├── middleware/
│   │   │   └── auth.ts          # JWT verify + admin guard
│   │   └── routes/
│   │       ├── auth.ts          # Login endpoint
│   │       ├── transactions.ts  # Customer transaction endpoints
│   │       └── admin.ts         # Admin endpoints
│   └── tests/
│       ├── setup.ts             # Test app + seeding helpers
│       ├── store.test.ts        # Store error handling tests
│       ├── auth.test.ts         # Login endpoint tests
│       ├── transactions.test.ts # Customer transaction tests
│       └── admin.test.ts        # Admin endpoint tests
└── frontend/
    └── src/
        ├── App.tsx              # Routes
        ├── AuthContext.tsx      # Auth state + login/logout
        ├── api.ts               # Fetch wrappers
        ├── types.ts             # Shared TypeScript types
        ├── ProtectedRoute.tsx   # Role-based route guard
        └── pages/
            ├── LoginPage.tsx
            ├── CustomerDashboard.tsx
            └── AdminDashboard.tsx
```
