import random
import string
import json
import httpx
from fastapi import APIRouter, HTTPException, Cookie
from bson import ObjectId
from datetime import date

from app.database import db
from app.services.auth_services import get_user_id_from_session
from app.models.guess_right import JoinGameInput, StartGameInput, SubmitClueInput, SubmitGuessInput, TopicEntry

router = APIRouter(prefix="/games", tags=["games"])

users_collection = db["users"]
games_collection = db["games"]

try:
    games_collection.create_index("room_code", unique=True)
except Exception as e:
    print(f"Could not create index on games.room_code: {e}")

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"


def get_current_username(session_token: str | None) -> str:
    """Resolve the caller's username from the Halo session cookie.

    Mirrors the pattern used in app/routers/auth.py so that game routes
    are protected the exact same way as the rest of the Halo API.
    """
    if not session_token:
        raise HTTPException(status_code=401, detail="Not logged in")
    user_id = get_user_id_from_session(session_token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session")
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user["name"]


def generate_room_code(length=6):
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


def generate_topics_with_ai(players: list[str]) -> list[TopicEntry]:
    """Call the Claude API to generate 1 topic + 2 opposite words per player.

    Falls back to a static topic list if the call fails (e.g. no API key
    configured for this deployment).
    """
    n = len(players)
    prompt = f"""You are the host of a social guessing game.
There are {n} players. Generate exactly {n} different and fun topics.
For each topic, generate 2 opposite words that represent the extremes of a spectrum from 0 to 10.

Reply ONLY in valid JSON, no text before or after, in this exact format:
[
  {{"topic": "Food", "word_low": "Healthy", "word_high": "Junk food"}},
  {{"topic": "Sport", "word_low": "Casual", "word_high": "Extreme"}}
]

Generate exactly {n} objects in the array. Be creative and varied."""

    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(
                ANTHROPIC_API_URL,
                headers={"Content-Type": "application/json"},
                json={
                    "model": "claude-sonnet-4-6",
                    "max_tokens": 1000,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            data = resp.json()
            text = data["content"][0]["text"].strip()
            text = text.replace("```json", "").replace("```", "").strip()
            topics_raw = json.loads(text)
            return [TopicEntry(**t) for t in topics_raw[:n]]
    except Exception:
        fallback = [
            TopicEntry(topic="Food", word_low="Healthy", word_high="Junk food"),
            TopicEntry(topic="Music", word_low="Classical", word_high="Metal"),
            TopicEntry(topic="Sport", word_low="Casual", word_high="Extreme"),
            TopicEntry(topic="Movies", word_low="Arthouse", word_high="Blockbuster"),
            TopicEntry(topic="Travel", word_low="Comfort", word_high="Adventure"),
            TopicEntry(topic="Technology", word_low="Minimalist", word_high="Geek"),
            TopicEntry(topic="Humor", word_low="Subtle", word_high="Absurd"),
            TopicEntry(topic="Fashion", word_low="Classic", word_high="Avant-garde"),
        ]
        return fallback[:n]


@router.post("/create")
def create_game(session_token: str | None = Cookie(default=None)):
    username = get_current_username(session_token)

    room_code = generate_room_code()
    while games_collection.find_one({"room_code": room_code}):
        room_code = generate_room_code()

    game = {
        "room_code": room_code,
        "host": username,
        "players": [username],
        "status": "waiting",
        "topics": [],
        "rounds": [],
        "current_round": 0,
        "total_scores": {username: 0},
        "current_clue_giver": None,
        "current_secret_number": None,
        "current_clue_word": None,
        "current_guesses": {},
        "players_who_gave_clue": [],
    }
    games_collection.insert_one(game)
    return {"room_code": room_code, "message": "Game created"}


@router.post("/join")
def join_game(body: JoinGameInput, session_token: str | None = Cookie(default=None)):
    username = get_current_username(session_token)

    game = games_collection.find_one({"room_code": body.room_code})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if game["status"] != "waiting":
        raise HTTPException(status_code=400, detail="The game has already started")
    if username in game["players"]:
        raise HTTPException(status_code=400, detail="You are already in this game")
    if len(game["players"]) >= 8:
        raise HTTPException(status_code=400, detail="Game full (8 players max)")

    games_collection.update_one(
        {"room_code": body.room_code},
        {
            "$push": {"players": username},
            "$set": {f"total_scores.{username}": 0},
        },
    )
    game = games_collection.find_one({"room_code": body.room_code})
    return {"message": "Joined the game", "players": game["players"], "host": game["host"]}


@router.post("/start")
def start_game(body: StartGameInput, session_token: str | None = Cookie(default=None)):
    username = get_current_username(session_token)

    game = games_collection.find_one({"room_code": body.room_code})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if game["host"] != username:
        raise HTTPException(status_code=403, detail="Only the host can start the game")
    if game["status"] != "waiting":
        raise HTTPException(status_code=400, detail="The game has already started")
    if len(game["players"]) < 2:
        raise HTTPException(status_code=400, detail="At least 2 players are required")

    players = game["players"]
    topics = generate_topics_with_ai(players)
    topics_dict = [t.dict() for t in topics]

    first_clue_giver = random.choice(players)
    secret_number = random.randint(1, 10)

    games_collection.update_one(
        {"room_code": body.room_code},
        {
            "$set": {
                "status": "active",
                "topics": topics_dict,
                "current_round": 0,
                "current_clue_giver": first_clue_giver,
                "current_secret_number": secret_number,
                "current_clue_word": None,
                "current_guesses": {},
                "players_who_gave_clue": [first_clue_giver],
            }
        },
    )
    game = games_collection.find_one({"room_code": body.room_code})
    return _format_game_state(game)


@router.get("/{room_code}/secret")
def get_secret(room_code: str, session_token: str | None = Cookie(default=None)):
    """Return the secret number ONLY to the current clue giver."""
    username = get_current_username(session_token)

    game = games_collection.find_one({"room_code": room_code})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if game.get("current_clue_giver") != username:
        raise HTTPException(status_code=403, detail="Access denied")
    return {"secret_number": game.get("current_secret_number")}


@router.get("/{room_code}")
def get_game(room_code: str, session_token: str | None = Cookie(default=None)):
    get_current_username(session_token)  # require login to view a game

    game = games_collection.find_one({"room_code": room_code})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return _format_game_state(game)


@router.post("/clue")
def submit_clue(body: SubmitClueInput, session_token: str | None = Cookie(default=None)):
    username = get_current_username(session_token)

    game = games_collection.find_one({"room_code": body.room_code})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if game["current_clue_giver"] != username:
        raise HTTPException(status_code=403, detail="It's not your turn to give a clue")
    if game["current_clue_word"]:
        raise HTTPException(status_code=400, detail="The clue has already been submitted")

    games_collection.update_one(
        {"room_code": body.room_code},
        {"$set": {"current_clue_word": body.clue_word}},
    )
    game = games_collection.find_one({"room_code": body.room_code})
    return _format_game_state(game)


@router.post("/guess")
def submit_guess(body: SubmitGuessInput, session_token: str | None = Cookie(default=None)):
    username = get_current_username(session_token)

    game = games_collection.find_one({"room_code": body.room_code})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if username == game["current_clue_giver"]:
        raise HTTPException(status_code=400, detail="The clue-giver cannot guess")
    if not game.get("current_clue_word"):
        raise HTTPException(status_code=400, detail="Waiting for the clue")
    if username in game.get("current_guesses", {}):
        raise HTTPException(status_code=400, detail="You have already guessed")
    if not (0 <= body.guess <= 10):
        raise HTTPException(status_code=400, detail="The value must be between 0 and 10")

    games_collection.update_one(
        {"room_code": body.room_code},
        {"$set": {f"current_guesses.{username}": body.guess}},
    )
    game = games_collection.find_one({"room_code": body.room_code})

    other_players = [p for p in game["players"] if p != game["current_clue_giver"]]
    guesses = game.get("current_guesses", {})

    if all(p in guesses for p in other_players):
        game = _resolve_round(game)

    return _format_game_state(game)


def _update_daily_scores(players: list[str], round_scores: dict, new_total_scores: dict, game: dict):
    """Update daily high scores for all players when the game finishes."""
    remaining = [p for p in players if p not in game.get("players_who_gave_clue", [])]
    if remaining:  # game not finished yet
        return
    
    today = date.today().isoformat()
    for player in players:
        total = new_total_scores.get(player, 0)
        user = users_collection.find_one({"name": player})
        if not user:
            continue
        
        existing = user.get("daily_scores", {}).get("guess_right", {})
        if existing.get("date") == today:
            new_score = max(existing.get("score", 0), total)
        else:
            new_score = total
        
        users_collection.update_one(
            {"name": player},
            {"$set": {"daily_scores.guess_right": {"score": new_score, "date": today}}}
        )


def _resolve_round(game):
    secret = game["current_secret_number"]
    guesses = game.get("current_guesses", {})

    round_scores = {}
    for player, guess in guesses.items():
        score = max(0, 10 - abs(guess - secret))
        round_scores[player] = score

    if guesses:
        avg_guess = sum(guesses.values()) / len(guesses)
        clue_giver_bonus = max(0, 10 - abs(avg_guess - secret))
        round_scores[game["current_clue_giver"]] = int(clue_giver_bonus)

    round_index = game["current_round"]
    topics = game.get("topics", [])
    topic_entry = topics[round_index] if round_index < len(topics) else {"topic": "?", "word_low": "0", "word_high": "10"}

    round_result = {
        "round_index": round_index,
        "clue_giver": game["current_clue_giver"],
        "topic": topic_entry.get("topic", "?"),
        "word_low": topic_entry.get("word_low", "0"),
        "word_high": topic_entry.get("word_high", "10"),
        "secret_number": secret,
        "clue_word": game["current_clue_word"],
        "guesses": guesses,
        "scores": round_scores,
    }

    new_total_scores = dict(game.get("total_scores", {}))
    for player, score in round_scores.items():
        new_total_scores[player] = new_total_scores.get(player, 0) + score

    players_who_gave_clue = game.get("players_who_gave_clue", [])
    all_players = game["players"]
    remaining = [p for p in all_players if p not in players_who_gave_clue]

    if not remaining:
        games_collection.update_one(
            {"room_code": game["room_code"]},
            {
                "$push": {"rounds": round_result},
                "$set": {
                    "status": "finished",
                    "total_scores": new_total_scores,
                    "current_clue_giver": None,
                    "current_secret_number": None,
                    "current_clue_word": None,
                    "current_guesses": {},
                },
            },
        )
    else:
        next_clue_giver = random.choice(remaining)
        next_secret = random.randint(1, 10)
        games_collection.update_one(
            {"room_code": game["room_code"]},
            {
                "$push": {
                    "rounds": round_result,
                    "players_who_gave_clue": next_clue_giver,
                },
                "$set": {
                    "current_round": round_index + 1,
                    "total_scores": new_total_scores,
                    "current_clue_giver": next_clue_giver,
                    "current_secret_number": next_secret,
                    "current_clue_word": None,
                    "current_guesses": {},
                },
            },
        )
    _update_daily_scores(all_players, round_scores, new_total_scores, game)
    return games_collection.find_one({"room_code": game["room_code"]})


def _format_game_state(game):
    """Format the game state for the frontend (hides secret_number unless finished)."""
    topics = game.get("topics", [])
    current_round = game.get("current_round", 0)
    current_topic = topics[current_round] if current_round < len(topics) else None

    return {
        "room_code": game["room_code"],
        "host": game["host"],
        "players": game["players"],
        "status": game["status"],
        "current_round": current_round,
        "total_rounds": len(game["players"]),
        "current_clue_giver": game.get("current_clue_giver"),
        "current_topic": current_topic,
        "current_clue_word": game.get("current_clue_word"),
        "current_guesses": game.get("current_guesses", {}),
        "rounds": game.get("rounds", []),
        "total_scores": game.get("total_scores", {}),
        "current_secret_number": game.get("current_secret_number") if game["status"] == "finished" else None,
    }
