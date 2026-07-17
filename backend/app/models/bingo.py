from pydantic import BaseModel
from typing import Optional

class BingoCell(BaseModel):
    proposition: str
    checked: bool = False

class BingoJoinInput(BaseModel):
    room_code: str

class BingoStartInput(BaseModel):
    room_code: str

class BingoCheckInput(BaseModel):
    room_code: str
    cell_index: int #0-8