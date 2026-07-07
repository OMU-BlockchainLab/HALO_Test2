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

## How to Add a New Feature

Not every feature needs all the pieces. Use only what you need:

| Your feature needs... | Then add... |
|---|---|
| Data stored in DB | `models/new.py` + collection in `routers/new.py` |
| Backend logic (LLM, scoring, matching...) | `services/new_service.py` |
| HTTP endpoints | `routers/new.py` + register in `main.py` |
| Frontend calls to backend | functions in `lib/api.ts` |
| A new page | `app/[name]/page.tsx` |

A purely frontend feature (e.g. a local game with no persistence) only needs a `page.tsx`. A feature that stores data needs models + router + page. Its up to you.

### Models (`models/new.py`)

Used to define the structure of custom objects / data stored or exchanged with the backend.

```python
from pydantic import BaseModel
from typing import Optional

class MyThing(BaseModel):           # what comes out of DB (has id)
    id: str
    field_one: str
    field_two: int

class MyThingCreate(BaseModel):     # what the frontend sends on creation (no id)
    field_one: str
    field_two: int

class MyThingUpdate(BaseModel):     # for PATCH endpoints — all fields optional
    field_one: Optional[str] = None
    field_two: Optional[int] = None
```

---

### Services (`services/new_service.py`)

Used to define functions for complex or reused logic accross the endpoints. This is the "utilities functions" (calling an LLM, computing a score, matching algorithm...). Pure CRUD can stay directly in the router.

```python
from app.database import db

collection = db['my_things']

def my_complex_logic(input):
    # anything more than basic CRUD goes here
    pass
```

---

### Endpoints (`routers/new.py`)

Used for any feature that communicates with the backend. One file in the routers/ directory stores every endpoint (get, post, patch...) used by the new feature.

```python
from fastapi import APIRouter, HTTPException, Cookie
from app.services.auth_service import get_user_id_from_session

router = APIRouter()

# Public endpoint — no auth required
@router.get("/my-things/{id}")
def get_thing(id: str):
    pass

# Protected endpoint — copy this auth block every time
@router.post("/my-things")
def create_thing(payload: MyThingCreate, session_token: str | None = Cookie(default=None)):
    if not session_token:
        raise HTTPException(status_code=401, detail="Not logged in")
    user_id = get_user_id_from_session(session_token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session expired")
    # your logic here
```

**Public vs protected:** If there is no `Cookie` parameter ==> anyone can call it. If you add the `session_token` + `get_user_id_from_session` block ==> logged-in users only.

Once your router exists, register it in `main.py` — without this, the endpoints don't exist:

```python
from app.routers.new import router as new_router
app.include_router(new_router)
```

---

