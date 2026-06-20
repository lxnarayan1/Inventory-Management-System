# InventoryOS — Inventory & Order Management System

I have made a full stack inventory and order management system: **React** (Vite) frontend, **FastAPI** backend, **PostgreSQL** database, fully Dockerized.

## Stack Used for this project

| Layer     | Technology                  |
|-----------|------------------------------|
| Frontend  | React 18 + Vite + react-router |
| Backend   | FastAPI + SQLAlchemy         |
| Database  | PostgreSQL 15 (SQLite fallback for local dev without Docker) |
| Container | Docker & Docker Compose      |

## Features

- Products, customers, and orders CRUD
- Order lifecycle: `pending → processing → shipped → delivered`, with `cancelled` at any non-terminal point
- Atomic stock deduction/restoration with row-level locking (`SELECT ... FOR UPDATE`) to prevent overselling
- Full inventory audit trail (`inventory_transactions`) for every stock change
- Low-stock detection (`quantity < reorder_level`)
- Dashboard with live stats (products, customers, orders, revenue, low-stock count)
- Search and status filtering on Orders, search on Products/Customers
- Soft-delete for customers with order history; hard-delete blocked for products referenced by orders

## Quick start (Docker — recommended)

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000 (docs at http://localhost:8000/docs)
- Postgres: localhost:5432

The backend auto-creates tables on startup. To load demo data matching the UI screenshots:

```bash
docker compose exec backend python -m app.seed
```

## Running locally without Docker

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python -m app.seed        # optional demo data (uses local SQLite by default)
uvicorn app.main:app --reload
```
API available at http://localhost:8000.

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
App available at http://localhost:5173 (or whichever port Vite reports).

## Project structure

```
inventory-system/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, router registration
│   │   ├── models.py          # SQLAlchemy models
│   │   ├── schemas.py         # Pydantic request/response schemas
│   │   ├── database.py        # Engine/session setup
│   │   ├── seed.py            # Demo data seeding script
│   │   ├── api/
│   │   │   ├── products.py
│   │   │   ├── customers.py
│   │   │   ├── orders.py
│   │   │   └── dashboard.py
│   │   └── services/
│   │       ├── inventory.py       # Stock adjustment + audit trail
│   │       └── order_processor.py # Order create/cancel with locking
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/client.js      # fetch wrapper for backend API
│   │   ├── components/        # Sidebar, modals, status badges
│   │   ├── pages/             # Dashboard, Products, Customers, Orders
│   │   └── App.jsx
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
└── .env.example
```

## API overview

Base URL: `/api/v1`

| Resource   | Endpoints |
|------------|-----------|
| Products   | `POST /products`, `GET /products`, `GET /products/{id}`, `PUT /products/{id}`, `DELETE /products/{id}`, `GET /products/{id}/history` |
| Customers  | `POST /customers`, `GET /customers`, `GET /customers/{id}`, `PUT /customers/{id}`, `DELETE /customers/{id}` |
| Orders     | `POST /orders`, `GET /orders`, `GET /orders/{id}`, `PATCH /orders/{id}/status`, `DELETE /orders/{id}` (cancel) |
| Dashboard  | `GET /dashboard/stats`, `GET /dashboard/recent-orders`, `GET /dashboard/low-stock` |

Interactive docs: `http://localhost:8000/docs`
