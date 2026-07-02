from pydantic import BaseModel
from typing import Optional

class Skill(BaseModel):
    name: str
    level: int # 0 = beginner/wants to learn -> 5 = proficient

class User(BaseModel):
    id: str
    name: str
    email: str
    age: int
    gender: int # 0 for male, 1 for female, 2 for other
    pwd_hash: str
    skills: list[Skill] = []

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[int] = None
    pwd_hash: Optional[str] = None
    skills: Optional[list[Skill]] = None

class RegisterRequest(BaseModel):
    name: str
    email: str
    pwd: str
    age: int
    gender: int

class LoginRequest(BaseModel):
    email: str
    pwd: str