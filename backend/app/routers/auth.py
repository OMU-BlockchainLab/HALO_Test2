from fastapi import APIRouter, HTTPException, Response, Cookie
from app.database import db
from app.models.user import LoginRequest, RegisterRequest
from app.services.auth_services import create_session, get_user_id_from_session, delete_session, verify_password, hash_password
from bson import ObjectId
from pydantic import BaseModel

router = APIRouter()
users_collection = db['users']

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

@router.post("/register")
def register_user(payload: RegisterRequest):
    if users_collection.find_one({"email": payload.email}):
        raise HTTPException(status_code=409, detail="Email already registered")
    user_dict = {
        "name": payload.name,
        "email": payload.email,
        "age": payload.age,
        "gender": payload.gender,
        "pwd_hash": hash_password(payload.pwd)
    }
    result = users_collection.insert_one(user_dict)
    return {
        "message": "User created successfully",
        "user_id": str(result.inserted_id)
    }

@router.post("/login")
def login(payload: LoginRequest, response: Response):
    user = users_collection.find_one({"email": payload.email})
    if not user or not verify_password(payload.pwd, user["pwd_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_session(str(user["_id"]))
    response.set_cookie(key="session_token", value=token, httponly=True, samesite="lax", secure=False, max_age = 1*24*60*60)
    return {"message": "Login successful"}

@router.post("/logout")
def logout(response: Response, session_token: str | None = Cookie(default=None)):
    if session_token:
        delete_session(session_token)
    response.delete_cookie(key="session_token")
    return {"message": "Logout successful"}

@router.get("/me")
def me(session_token: str | None = Cookie(default=None)):
    if not session_token:
        raise HTTPException(status_code=401, detail="Not logged in")
    user_id = get_user_id_from_session(session_token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session")
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "age": user["age"],
        "gender": user["gender"],
        "skills": user.get("skills", []),
        "daily_scores": user.get("daily_scores", {})
    }

@router.post("/me/password")
def change_password(payload: ChangePasswordRequest, session_token: str | None = Cookie(default=None)):
    if not session_token:
        raise HTTPException(status_code=401, detail="Not logged in")
    user_id = get_user_id_from_session(session_token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session")
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    if not verify_password(payload.old_password, user["pwd_hash"]):
        raise HTTPException(status_code=401, detail="Old password is incorrect")
    
    new_pwd_hash = hash_password(payload.new_password)
    users_collection.update_one({"_id": ObjectId(user_id)}, {"$set": {"pwd_hash": new_pwd_hash}})
    return {"message": "Password changed successfully"}