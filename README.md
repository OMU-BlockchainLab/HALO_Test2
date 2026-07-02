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
