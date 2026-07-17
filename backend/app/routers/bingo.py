import random
import string
import json
import httpx
from fastapi import APIRouter, HTTPException, Cookie
from bson import ObjectId

from app.database import db
from app.services.auth_services import get_user_id_from_session
from app.models.bingo import BingoJoinInput, BingoStartInput, BingoCheckInput

router = APIRouter(prefix="/bingo", tags=["bingo"])

users_collection = db["users"]
bingo_collection = db["bingo_games"]

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

WINNING_LINES = [
    [0,1,2], [3,4,5], [6,7,8],  # rows
    [0,3,6], [1,4,7], [2,5,8],  # cols
    [0,4,8], [2,4,6]            # diagonals
]

example_prompts = [
    "Likes anime",
    "Has traveled abroad",
    "Speaks more than one language",
    "Enjoys cooking",
    "Has a pet",
    "Plays video games",
    "Drinks coffee every day",
    "Likes karaoke",
    "Has watched a Studio Ghibli movie",
    "Enjoys gardening",
    "Has visited another prefecture this year",
    "Can cook a traditional dish",
    "Likes music festivals",
    "Has played a musical instrument",
    "Enjoys photography",
    "Prefers tea over coffee",
    "Has tried learning a foreign language",
    "Likes board games",
    "Enjoys hiking or walking",
    "Has stayed up all night gaming or studying",
    "Enjoys spicy food",
    "Has recommended an anime to someone",
    "Knows how to use chopsticks well",
    "Has taught someone a skill",
    "Enjoys museums or exhibitions",
    "Has participated in a club activity",
    "Likes trying new restaurants",
    "Uses social media every day",
    "Has watched a movie recently",
    "Enjoys collaborative activities"
]

def get_current_user(session_token: str | None) -> dict:
    if not session_token:
        raise HTTPException(status_code=401, detail="Not logged in")
    user_id = get_user_id_from_session(session_token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session")
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def generate_room_code(length=6):
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))

def check_bingo(cells: list[dict]) -> bool:
    return any(all(cells[i]["checked"] for i in line) for line in WINNING_LINES)

def generate_grids(players_with_skills: list[dict]) -> dict:
    """Call Claude to generate 9 bingo propositions per player based on their skills."""
    players_info = "\n".join(
        f"- {p['name']}: {', '.join(s['name'] for s in p.get('skills', [])) or 'no skills listed'}"
        for p in players_with_skills
    )
    n = len(players_with_skills)
    prompt = f"""You are the host of a social icebreaker bingo game.
        There are {n} players with the following profiles:
        {players_info}

        Generate a 3x3 bingo grid (9 propositions) for EACH player.
        Propositions should be things like the examples listed: {', '.join(example_prompts)}. You can use these examples
        if relevant to the players' skills, but also create new ones based on their skills and hobbies.
        Make them fun, varied, and when possible based on the skills/hobbies listed above in the players' profiles so the bingo is actually finishable.
        Propositions can repeat across different players' grids.

        Reply ONLY in valid JSON, no text before or after, in this exact format:
        {{
        "PlayerName1": ["proposition 1", "proposition 2", ..., "proposition 9"],
        "PlayerName2": ["proposition 1", ..., "proposition 9"]
        }}

        Use the exact player names as keys."""

    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(
                ANTHROPIC_API_URL,
                headers={"Content-Type": "application/json"},
                json={
                    "model": "claude-sonnet-4-6",
                    "max_tokens": 2000,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            data = resp.json()
            text = data["content"][0]["text"].strip()
            text = text.replace("```json", "").replace("```", "").strip()
            raw = json.loads(text)
            grids = {}
            for player in players_with_skills:
                name = player["name"]
                propositions = raw.get(name, [])[:9]
                grids[name] = [{"proposition": p, "checked": False} for p in propositions]
            return grids
        
    except Exception:
        # Fallback generic propositions
        fallback = [
            "Find someone who has a pet",
            "Find someone who speaks 3+ languages",
            "Find someone who plays a musical instrument",
            "Find someone who has lived abroad",
            "Find someone who can cook a dish from another country",
            "Find someone who does a sport regularly",
            "Find someone who has read 10+ books this year",
            "Find someone who knows how to code",
            "Find someone who has visited more than 5 countries",
        ]
        return {
            p["name"]: [{"proposition": prop, "checked": False} for prop in random.sample(fallback, min(9, len(fallback)))]
            for p in players_with_skills
        }

def format_game_state(game: dict, username: str) -> dict:
    return {
        "room_code": game["room_code"],
        "host": game["host"],
        "players": game["players"],
        "status": game["status"],
        "winner": game.get("winner"),
        "my_grid": game.get("grids", {}).get(username, []),
    }

@router.post("/create")
def create_bingo(session_token: str | None = Cookie(default=None)):
    user = get_current_user(session_token)
    username = user["name"]

    room_code = generate_room_code()
    while bingo_collection.find_one({"room_code": room_code}):
        room_code = generate_room_code()

    bingo_collection.insert_one({
        "room_code": room_code,
        "host": username,
        "players": [username],
        "status": "waiting",
        "grids": {},
        "winner": None,
    })
    return {"room_code": room_code, "message": "Game created"}

@router.post("/join")
def join_bingo(body: BingoJoinInput, session_token: str | None = Cookie(default=None)):
    user = get_current_user(session_token)
    username = user["name"]

    game = bingo_collection.find_one({"room_code": body.room_code})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if game["status"] != "waiting":
        raise HTTPException(status_code=400, detail="Game already started")
    if username in game["players"]:
        raise HTTPException(status_code=400, detail="Already in this game")
    if len(game["players"]) >= 8:
        raise HTTPException(status_code=400, detail="Game full")

    bingo_collection.update_one(
        {"room_code": body.room_code},
        {"$push": {"players": username}}
    )
    game = bingo_collection.find_one({"room_code": body.room_code})
    return {"message": "Joined", "players": game["players"], "host": game["host"]}  

@router.post("/start")
def start_bingo(body: BingoStartInput, session_token: str | None = Cookie(default=None)):
    user = get_current_user(session_token)
    username = user["name"]

    game = bingo_collection.find_one({"room_code": body.room_code})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if game["host"] != username:
        raise HTTPException(status_code=403, detail="Only the host can start")
    if game["status"] != "waiting":
        raise HTTPException(status_code=400, detail="Game already started")
    if len(game["players"]) < 2:
        raise HTTPException(status_code=400, detail="At least 2 players required")

    players_with_skills = [
        users_collection.find_one({"name": p}) or {"name": p, "skills": []}
        for p in game["players"]
    ]
    grids = generate_grids(players_with_skills)

    bingo_collection.update_one(
        {"room_code": body.room_code},
        {"$set": {"status": "active", "grids": grids}}
    )
    game = bingo_collection.find_one({"room_code": body.room_code})
    return format_game_state(game, username)

@router.get("/{room_code}")
def get_bingo(room_code: str, session_token: str | None = Cookie(default=None)):
    user = get_current_user(session_token)
    game = bingo_collection.find_one({"room_code": room_code})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return format_game_state(game, user["name"])

@router.post("/check")
def check_cell(body: BingoCheckInput, session_token: str | None = Cookie(default=None)):
    user = get_current_user(session_token)
    username = user["name"]

    game = bingo_collection.find_one({"room_code": body.room_code})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if game["status"] != "active":
        raise HTTPException(status_code=400, detail="Game not active")
    if username not in game.get("grids", {}):
        raise HTTPException(status_code=400, detail="No grid found for this player")
    if not (0 <= body.cell_index <= 8):
        raise HTTPException(status_code=400, detail="Invalid cell index")

    grid = game["grids"][username]
    grid[body.cell_index]["checked"] = True

    update = {f"grids.{username}": grid}

    if check_bingo(grid):
        update["status"] = "finished"
        update["winner"] = username

    bingo_collection.update_one({"room_code": body.room_code}, {"$set": update})
    game = bingo_collection.find_one({"room_code": body.room_code})
    return format_game_state(game, username)

