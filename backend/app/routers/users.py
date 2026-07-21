from fastapi import APIRouter, HTTPException
from app.database import db
from app.models.user import User, UserUpdate
from bson import ObjectId

def user_helper(user_dict: dict) -> User:
    return User(
        id=str(user_dict["_id"]),
        name=user_dict["name"],
        email=user_dict["email"],
        age=user_dict["age"],
        gender=user_dict["gender"],
        pwd_hash=user_dict["pwd_hash"],
        skills=user_dict.get("skills", []),
        daily_scores=user_dict.get("daily_scores", {})
    )

users_collection = db['users']
router = APIRouter()

@router.get("/users")
def get_users(gender: int | None = None, min_age: int | None = None, max_age: int | None = None):
    query = {}
    if gender is not None:
        query["gender"] = gender
    if min_age is not None or max_age is not None:
        query["age"] = {}
    if min_age is not None:
        query["age"]["$gte"] = min_age
    if max_age is not None:
        query["age"]["$lte"] = max_age
    users = []
    for user in users_collection.find(query):
        user['_id'] = str(user['_id'])  # Convert ObjectId to string
        users.append(user_helper(user))
    return users

@router.get("/users/{user_id}")
def get_user(user_id: str):
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user['_id'] = str(user['_id'])  # Convert ObjectId to string
    print(user_helper(user))
    return user_helper(user)

@router.delete("/users/{user_id}")
def delete_user(user_id: str):
    result = users_collection.delete_one({
        "_id": ObjectId(user_id)
    })

    return {
        "deleted": result.deleted_count
    }

@router.patch("/users/{user_id}")
def update_user(user_id: str, user_update: UserUpdate):
    update_data = user_update.model_dump(exclude_unset=True)
    result = users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    return {
        "matched": result.matched_count,
        "modified": result.modified_count
    }