from pydantic import BaseModel
from typing import Optional

class Beacon(BaseModel):
    id: str
    name: str
    address: str
    capacity: int

class BeaconCreate(BaseModel):
    name: str
    address: str
    capacity: int

class BeaconUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    capacity: Optional[int] = None