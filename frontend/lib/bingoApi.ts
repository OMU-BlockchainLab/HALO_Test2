import { API_URL } from "@/lib/api"

async function bingoFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}/bingo${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || "Request failed")
  }
  return response.json()
}

export const createBingo = () => bingoFetch("/create", { method: "POST" })
export const joinBingo = (room_code: string) => bingoFetch("/join", { method: "POST", body: JSON.stringify({ room_code }) })
export const startBingo = (room_code: string) => bingoFetch("/start", { method: "POST", body: JSON.stringify({ room_code }) })
export const getBingo = (room_code: string) => bingoFetch(`/${room_code}`)
export const checkCell = (room_code: string, cell_index: number) => bingoFetch("/check", { method: "POST", body: JSON.stringify({ room_code, cell_index }) })