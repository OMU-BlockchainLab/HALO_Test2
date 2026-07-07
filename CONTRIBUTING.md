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
## How it all fits together

**The backend** is a server. It runs permanently, holds the business logic, and is the only one allowed to talk to the database. It exposes HTTP endpoints that the frontend can call to request or send data. It never directly touches what the user sees.

**The frontend** is what the user sees and interacts with. It has no direct access to the database and can only ask the backend for data, or send data to the backend to be processed and stored. It is responsible for rendering the UI and reacting to user actions.

**The database** stores everything that needs to persist. Only the backend talks to it.

```
User ↔ Frontend (Next.js) ↔ Backend (FastAPI) ↔ Database (MongoDB)
```

When a user does something on the frontend (submits a form, clicks a button), the frontend sends an HTTP request to the backend. The backend processes it: validates data, applies logic, reads or writes to the DB... and sends a response back. The frontend then updates what the user sees based on that response.

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

## Backend

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

## Frontend

### Fetch functions (`lib/api.ts`)

Whenever the frontend wants to call a endpoint from the backend (get, post...), we use the fetch(url) function with url being the url of the backend endpoint we want to call. Try to never write `fetch()` directly in a Next.js page. Instead, always go through `lib/api.ts`. This file centralizes every fetch requests functions in one place. This is better for the long run because if at any point (e.g. during deployment of the app) the url changes, we only need change it in one file:

```typescript
export async function getMyThing(id: string) {
  const response = await fetch(`${API_URL}/my-things/${id}`, {
    credentials: "include"  // always include — sends the session cookie
  })
  if (!response.ok) throw new Error("Not found")
  return response.json()
}
```

---

### Page (`app/[name]/page.tsx`)

Always needed. This is the page the users will see. Structure depends on whether the page is protected and whether it fetches data:

```tsx
"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/api"

export default function MyPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    async function load() {
      // Only needed on protected pages
      const user = await getCurrentUser()
      if (!user) { router.push("/login"); return }

      // fetch your data here if needed
      setData(...)
    }
    load()
  }, [router])

  // Always handle loading state — avoids rendering with undefined data
  if (!data) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>

  return (
    <div className="p-8">
      {/* your UI */}
    </div>
  )
}
```

**Rules:**
- `"use client"` at the top if the page uses `useState`, `useEffect`, or event handlers.
- The auth check at the start of `useEffect` if the page is protected.
- Always handle the loading state before rendering.
- For dynamic routes (e.g. `/profile/[id]`): create a folder literally named `[id]` and use `React.use(params)` to unwrap the id (see frontend/app/profile/[id]/page.tsx for a working example).

---

## Explaining Sessions & Cookies

1. On `/login`, the server generates a random token, stores it in the `sessions` MongoDB collection, and sends it back as an httpOnly cookie.
2. The browser stores the cookie and automatically attaches it to every subsequent request to the backend.
3. Protected endpoints read the cookie via `Cookie(default=None)`, look it up in `sessions`, and get the `user_id` from there.
4. On `/logout`, the session is deleted from MongoDB and the browser cookie is cleared.

Frontend fetch calls must include `credentials: "include"` — without it, the browser won't send the cookie on cross-origin requests (`localhost:3000` → `localhost:8000`).

---
