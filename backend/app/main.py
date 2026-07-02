from fastapi import FastAPI
from app.routers.users import router as users_router
from app.routers.auth import router as auth_router
from app.routers.beacons import router as beacons_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(users_router)
app.include_router(auth_router)
app.include_router(beacons_router)