# Build Log — CardApp

A record of the prompts and decisions made during the development of this application, built collaboratively with Claude Code.

---

## 1. Initial Requirements

**Prompt:**
> I want to develop a simple fullstack application for a credit card company. I want the application to allow customers to view their transactions and for the backend system allow backend users to manage transaction states.

**Prompt:**
> For the customer view, I want them to be able to see a list of transactions (date, merchant name, amount, status), have a status filter with date range too and the UI needs to be responsive.

**Prompt:**
> The backend API should be able to handle these:
> - Retrieve Transactions: An endpoint to fetch all transactions for a single user/account.
> - Create Transaction: An endpoint to create a new transaction (simulating a purchase).
> - Reverse Transaction: An endpoint to update an existing transaction's status to 'Reversed'. Logic: Only transactions with a 'Posted' status can be reversed.

**Prompt:**
> A simple JSON file for the data persistence, not a major DB setup required.

**Decision:** Stack chosen — React + TypeScript + Tailwind CSS (frontend), Node.js + Express + TypeScript (backend), JSON file persistence, JWT auth with role-based access (customer vs admin).

---

## 2. Backend Implementation

Built in the following order:
- `store.ts` — `readDb()` / `writeDb()` using Node.js `fs`
- `middleware/auth.ts` — JWT verify middleware + `requireAdmin` guard
- `routes/auth.ts` — `POST /api/auth/login`
- `routes/transactions.ts` — Customer transaction endpoints
- `routes/admin.ts` — Admin endpoints (all transactions, reverse, list users)
- `seed.ts` — 1 admin + 3 customers + 15 transactions
- `server.ts` — Express app entry point with JWT_SECRET startup guard

---

## 3. Backend Code Review

**Prompt:**
> Not yet, let's review the backend code first, run a code review.

**Issues found and fixed:**
- Route path mismatch — admin routes were mounting at `/api/transactions/admin` instead of `/api/admin/transactions`. Fixed by creating a separate `admin.ts` router.
- `amount: 0` was incorrectly accepted — `!amount` is falsy for zero. Fixed to explicit: `amount === undefined || amount === null || isNaN(Number(amount)) || Number(amount) <= 0`.
- Admins could create transactions — no role guard on `POST /api/transactions`. Added `403` for non-customer roles.
- `JWT_SECRET` not validated on startup — added `process.exit(1)` guard in `server.ts`.
- Unused import — `requireAdmin` left in `transactions.ts` after refactor. Removed.

---

## 4. Tests

**Prompt:**
> Not yet, we need to write some tests.

**Prompt:**
> Not yet, review the code first. *(after initial test implementation)*

**Test suite built:**
- `tests/setup.ts` — isolated test DB, `buildApp()`, `seedTestDb()`, `cleanTestDb()`
- `tests/auth.test.ts` — 5 tests: valid login (customer/admin), wrong password, unknown email, missing fields
- `tests/transactions.test.ts` — 9 tests: customer isolation, sort order, status filter, auth errors, create PENDING, admin blocked, input validation
- `tests/admin.test.ts` — 11 tests: all transactions, `customer_name` attached, filters, auth guards, reverse state machine (200/422/404/403)

**Issues found and fixed during test review:**
- `setupFilesAfterFramework` typo in Jest config — fixed to `setupFilesAfterEachTest`.
- Deprecated `globals` ts-jest config — migrated to `transform` key.
- Test state mutation — reverse test mutated `POSTED_TX_ID`; final 403 test used same ID. Fixed with dedicated `POSTED_TX_ID_2` fixture.
- Two HTTP calls in one `it` block — split into separate tests.
- bcrypt rounds reduced from 10 → 1 in tests (test time dropped ~3s → ~1s).
- IDE TypeScript errors for Jest globals — fixed with `tsconfig.test.json` + `tests/tsconfig.json`.

---

## 5. Frontend Implementation

**Prompt:**
> Commit and let's move on to the frontend.

Built:
- `AuthContext.tsx` — login/logout, token in `localStorage`, JWT decode
- `ProtectedRoute.tsx` — role-based route guard
- `api.ts` — fetch wrappers with Bearer token
- `pages/LoginPage.tsx`
- `pages/CustomerDashboard.tsx` — transaction table, status pills, date range, new transaction form
- `pages/AdminDashboard.tsx` — all transactions table, reverse action, filters

---

## 6. Frontend Code Review

**Prompt:**
> Yes, review the code.

**Issues found and fixed:**
- `import type` violations — `verbatimModuleSyntax` enabled in tsconfig. Fixed in `api.ts`, `AdminDashboard.tsx`, `AuthContext.tsx`, `ProtectedRoute.tsx`.
- Deprecated `FormEvent` — React 19 deprecation. Replaced with `{ preventDefault(): void }` in `LoginPage.tsx` and `CustomerDashboard.tsx`.
- `load()` function missing from `useEffect` deps — refactored to inline fetch with `cancelled` flag pattern.
- Fire-and-forget `load()` after create — replaced with `setRefresh(n => n + 1)` pattern.
- `user.email` always `''` after page reload — JWT didn't include email. Added `email` to JWT payload in `auth.ts` and updated `decodeToken()` in `AuthContext.tsx`.
- Tailwind v4 compatibility — `npx tailwindcss init -p` not found; v4 uses `@tailwindcss/vite` plugin. Fixed with `@import "tailwindcss"` in CSS.

---

## 7. Datetime Storage

**Prompt:**
> Transactions should be stored as datetime not date so the customer can know exactly when they made the payments.

**Prompt:**
> What timezone are the dates stored in?

**Prompt:**
> Yes, that's what I thought. Store the dates in UTC, the browser will convert it to local time on display, the date filter should also respect the local time.

**Decision:** Store UTC ISO strings (`toISOString()`). Frontend converts with `new Date().toLocaleDateString/toLocaleTimeString`. Backend date filters use `new Date(t.transaction_date).toLocaleDateString('en-CA')` to compare against local date values from the query string.

**Changes:**
- `seed.ts` — `utcDatetime(daysBack, hour, minute)` helper using `setHours` + `toISOString()`
- `routes/transactions.ts` POST — `transaction_date: now` (full UTC ISO string)
- `routes/transactions.ts` + `routes/admin.ts` GET — filter with `toLocaleDateString('en-CA')`
- `CustomerDashboard.tsx` + `AdminDashboard.tsx` — display with `new Date()` conversion

---

## 8. Searchable Customer Dropdown

**Prompt:**
> For the admin page, update the dropdown for customers such that the user can type to search.

**Implementation:** Replaced native `<select>` with a custom combobox:
- Text input filters the customer list in real time
- Click a name to select; input shows selected customer as placeholder
- `×` button clears the selection
- Click outside closes the dropdown (`mousedown` + `contains()` detection)
- `onMouseDown` on list items prevents input blur firing before selection
- Escape key closes and clears the search

---

## 9. Full Code Review

**Prompt:**
> Review all the code.

**Real bugs fixed:**
1. **`LoginPage.tsx`** — Duplicate unsafe JWT decode after `await login()`. `login()` now returns the decoded `User` object directly; `LoginPage` destructures `role` from it — no more `atob`/`split` in the page.
2. **`store.ts`** — `JSON.parse` not wrapped in try/catch. A corrupted `db.json` would crash the server with an unreadable error. Now throws: `"Database file is corrupted and cannot be parsed"`.
3. **`AdminDashboard.tsx`** — Combobox had no Escape key handler. Added `onKeyDown` to close and clear on Escape.

**Accepted trade-offs (inherent to demo design):**
- JSON file race condition on concurrent writes — no locking without a real database.
- No rate limiting on login endpoint.
- CORS open to all origins — would be configured per-environment in production.
- Floating-point money — would use integers (cents) in a real financial system.
- No token refresh — users are signed out after 8 hours.

---

## 10. Test Updates

**Prompt:**
> Update unit tests.

**Added / updated:**
- `tests/store.test.ts` *(new)* — 3 tests: missing file returns empty state, corrupted JSON throws clear error, valid content parses correctly.
- `tests/transactions.test.ts` — Added ISO datetime format assertion on POST (`YYYY-MM-DDTHH:MM:SSZ`). Added `from` and `to` date range filter tests.
- `tests/admin.test.ts` — Added `from` and `to` date range filter tests.

**Final count: 36 tests across 4 suites, all passing.**

---

## Final Commit History

| Commit | Description |
|--------|-------------|
| Initial | Backend — store, auth middleware, routes, seed, server |
| +tests | Backend test suite (auth, transactions, admin) |
| +frontend | React app — auth context, dashboards, routing |
| datetime | Store UTC datetimes; display in local time; filters respect local timezone |
| review fixes | Login decode bug, searchable combobox, store error handling, test coverage |
| readme | Setup instructions and project documentation |
