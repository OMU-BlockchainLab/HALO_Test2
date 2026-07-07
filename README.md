# HALO Project

HALO is an intergenerational networking web app for people to share skills, knowledge, and experiences.

## Tech Stack

- **Frontend:** React / Next.js
- **Backend:** Python (FastAPI)
- **Database:** MongoDB

## Getting Started

### 1. Backend Setup

Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Run the backend server (from the `backend/` directory):

```bash
cd backend
python -m uvicorn app.main:app --reload
```

### 2. Frontend Setup

Run the frontend dev server (from the `frontend/` directory):

```bash
cd frontend
npm run dev
```

## Project Structure

```
HALOProject/
├── backend/    # FastAPI backend
├── frontend/   # Next.js frontend
```

## Troubleshooting

### If the frontend seems to launch but hangs on "Compiling..." forever (no errors, no output)

This usually happens after moving/renaming the project folder — Next.js's build cache (`.next`) or `node_modules` can end up referencing the old path. Fix:

```bash
cd frontend
rm -rf .next node_modules
npm install
npm run dev
```

## Status

Work in progress.

# Contributing

This is a developer's guide on how to add a new feature (like a game) to the current HALO Project structure

## Project Structure

```
backend/app/
├── models/         # Data shapes (Pydantic)
├── routers/        # HTTP endpoints (FastAPI)
├── services/       # Reusable business logic
├── database.py     # MongoDB connection
└── main.py         # Entry point, router registration, CORS

frontend/
├── app/
│   ├── [feature]/
│   │   └── page.tsx    # One page = one folder + page.tsx
│   └── lib/
│       └── api.ts      # All fetch calls centralized here
```

---

## Architecture Rules

| Where to put it | When |
|---|---|
| `models/new.py` | New object stored in DB |
| `services/new_service.py` | Complex or reusable logic |
| `routers/new.py` | New endpoints |
| `main.py` | Register every new router here |
| `lib/api.ts` | Every new fetch call |
| `app/[name]/page.tsx` | New page |

---
