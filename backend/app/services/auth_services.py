import bcrypt
import secrets
from datetime import  datetime, timedelta, timezone
from app.database import db

sessions_collection = db['sessions']
SESSION_DURATION = timedelta(days=1)

def create_session(user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    sessions_collection.insert_one({
        "_id": token,
        "user_id": user_id,
        "expires_at": datetime.now(timezone.utc) + SESSION_DURATION
    })
    return token

def get_user_id_from_session(token: str) -> str | None:
    session = sessions_collection.find_one({"_id": token})
    if not session:
        return None
    expires_at = session["expires_at"].replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        sessions_collection.delete_one({"_id": token})
        return None
    return session["user_id"]

def delete_session(token: str) -> None:
    sessions_collection.delete_one({"_id": token})

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, pwd_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), pwd_hash.encode())