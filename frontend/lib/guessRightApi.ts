import { API_URL } from "./api"

async function handle(response: Response) {
    if (!response.ok) {
        let detail = "Request failed"
        try {
            const data = await response.json()
            detail = data.detail || detail
        } catch {
            // ignore
        }
        throw new Error(detail)
    }
    return response.json()
}

export async function createGame() {
    const response = await fetch(`${API_URL}/games/create`, {
        method: "POST",
        credentials: "include",
    })
    return handle(response)
}

export async function joinGame(room_code: string) {
    const response = await fetch(`${API_URL}/games/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ room_code }),
    })
    return handle(response)
}

export async function startGame(room_code: string) {
    const response = await fetch(`${API_URL}/games/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ room_code }),
    })
    return handle(response)
}

export async function getGame(room_code: string) {
    const response = await fetch(`${API_URL}/games/${room_code}`, {
        credentials: "include",
    })
    return handle(response)
}

export async function getSecret(room_code: string) {
    const response = await fetch(`${API_URL}/games/${room_code}/secret`, {
        credentials: "include",
    })
    return handle(response)
}

export async function submitClue(room_code: string, clue_word: string) {
    const response = await fetch(`${API_URL}/games/clue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ room_code, clue_word }),
    })
    return handle(response)
}

export async function submitGuess(room_code: string, guess: number) {
    const response = await fetch(`${API_URL}/games/guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ room_code, guess }),
    })
    return handle(response)
}
