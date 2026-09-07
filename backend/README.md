# Housing System – MongoDB Backend

Express + Mongoose API that replaces the frontend’s `localStorage` store (`eh_store_v3`) and auth (`eh_users_v1`).

## Requirements

- Node.js 18+
- MongoDB 6+ (local or Atlas)

## Quick start

```bash
cd backend
cp .env.example .env
# edit .env if needed (MONGODB_URI, JWT_SECRET)

npm install
npm run seed          # creates admin@housing.local / admin123
npm run dev           # or: npm start
```

API base: `http://localhost:5000/api`

## Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register admin |
| POST | `/auth/register-tenant` | Register tenant (must already exist as a Tenant record) |
| POST | `/auth/login` | Login → returns `{ token, user }` |
| GET | `/auth/me` | Current user (Bearer token) |

Send the JWT on every protected request:

```
Authorization: Bearer <token>
```

Roles: `admin` | `tenant`. Tenants are restricted to their own leases, invoices, maintenance, messages, etc.

## Resources (CRUD)

All use the same string `id` field that the React app already generates (e.g. `PROP-…`, `UNT-…`).

| Path | Notes |
|------|--------|
| `/properties` | Cascade delete of units / related data |
| `/units` | |
| `/tenants` | `GET /tenants/me` for tenant portal |
| `/leases` | Filtered by `tenantId` for tenants |
| `/invoices` | `POST /:id/pay`, `POST /:id/late-fee` |
| `/expenses` | Admin only |
| `/maintenance` | Tenants can create; `PATCH /:id/status` |
| `/messages` | `POST /:id/reply`, `PATCH /:id/read` |
| `/owners` | Admin only |
| `/vendors` | Admin only |
| `/documents` | Admin only |
| `/payments` | |
| `/notifications` | `PATCH /:id/read`, `PATCH /read-all`, `DELETE /` |
| `/announcements` | Readable by both roles |
| `/audit` | Admin only |
| `/store` | Bulk GET / PUT / DELETE of entire dataset |

## Frontend integration sketch

Replace `localStorage` calls in `AuthContext` and `StoreContext` with `fetch` against this API.

Example login:

```js
const res = await fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const { token, user } = await res.json();
localStorage.setItem("token", token);
```

Example list properties:

```js
const res = await fetch("http://localhost:5000/api/properties", {
  headers: { Authorization: `Bearer ${token}` },
});
const properties = await res.json();
```

For a full migration you can:

1. Keep the existing reducer for optimistic UI.
2. On each action, also call the matching REST endpoint.
3. Or switch to a server-state library (React Query / SWR) and drop the local reducer.

## Environment

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/housing_system
JWT_SECRET=your-long-random-secret
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

## Data model

Matches the schema documented in `src/data.js` of the frontend:

- properties, units, tenants, leases, invoices, expenses  
- maintenance, messages, announcements, owners, vendors  
- documents, payments, notifications, auditLog  

Plus a separate `users` collection for authentication.
