from pydantic import BaseModel
from typing import Optional
from enum import Enum


class GameStatus(str, Enum):
    WAITING = "waiting"
    ACTIVE = "active"
    FINISHED = "finished"


class TopicEntry(BaseModel):
    topic: str
    word_low: str
    word_high: str


class RoundResult(BaseModel):
    round_index: int
    clue_giver: str
    topic: str
    word_low: str
    word_high: str
    secret_number: int
    clue_word: str
    guesses: dict
    scores: dict


# --- Request bodies. Note: the caller's identity (username) is never taken
# from the request body, it is always derived from the Halo session cookie,
# the same way the rest of the Halo API works (see routers/auth.py). ---

class JoinGameInput(BaseModel):
    room_code: str


class StartGameInput(BaseModel):
    room_code: str


class SubmitClueInput(BaseModel):
    room_code: str
    clue_word: str


class SubmitGuessInput(BaseModel):
    room_code: str
    guess: int
