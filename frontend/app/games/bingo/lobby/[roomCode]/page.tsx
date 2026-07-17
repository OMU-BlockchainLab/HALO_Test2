"use client"
import { use, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/api"
import { getBingo, startBingo } from "@/lib/bingoApi"

export default function BingoLobbyPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = use(params)
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [game, setGame] = useState<any>(null)
  const [error, setError] = useState("")
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const u = await getCurrentUser()
      if (!u) { router.push("/login"); return }
      setUser(u)
    }
    checkAuth()
  }, [router])

  const fetchGame = useCallback(async () => {
    try {
      const data = await getBingo(roomCode)
      setGame(data)
      if (data.status === "active") router.push(`/games/bingo/play/${roomCode}`)
    } catch { setError("Game not found") }
  }, [roomCode, router])

  useEffect(() => {
    if (!user) return
    fetchGame()
    const interval = setInterval(fetchGame, 2000)
    return () => clearInterval(interval)
  }, [user, fetchGame])

  async function handleStart() {
    setStarting(true)
    try {
      await startBingo(roomCode)
      router.push(`/games/bingo/play/${roomCode}`)
    } catch (err: any) {
      setError(err.message)
      setStarting(false)
    }
  }

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-red-600 text-xl">{error}</p>
      <button className="bg-gray-500 text-white px-4 py-2 rounded" onClick={() => router.push("/games/bingo")}>Back</button>
    </div>
  )

  if (!user || !game) return <div className="min-h-screen flex items-center justify-center"><p className="animate-pulse">Loading...</p></div>

  const isHost = game.host === user.name

  return (
    <div className="min-h-screen p-8 flex justify-center">
      <div className="border rounded p-6 w-full max-w-md space-y-6">
        <button className="text-blue-500 hover:underline text-sm" onClick={() => router.push("/games/bingo")}>&larr; Leave</button>

        <div className="text-center">
          <p className="text-gray-600 text-sm mb-1">Game code</p>
          <div className="text-4xl font-black font-mono tracking-widest text-green-600 bg-green-50 rounded py-3 px-6 inline-block">{roomCode}</div>
          <p className="text-gray-500 text-xs mt-2">Share this code with your group</p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-lg">Players</h2>
            <span className="text-gray-500 text-sm">{game.players.length} connected</span>
          </div>
          <div className="space-y-2">
            {game.players.map((player: string) => (
              <div key={player} className="flex items-center gap-3 bg-gray-100 rounded px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm">{player[0].toUpperCase()}</div>
                <span className="font-medium">{player}</span>
                {player === game.host && <span className="ml-auto text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">Host</span>}
                {player === user.name && player !== game.host && <span className="ml-auto text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">You</span>}
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <button className="bg-green-500 text-white px-4 py-2 rounded w-full disabled:opacity-50" onClick={handleStart} disabled={game.players.length < 2 || starting}>
            {starting ? "Generating grids with AI..." : game.players.length < 2 ? "Waiting for players..." : "🚀 Start the game"}
          </button>
        ) : (
          <p className="text-center text-gray-500 animate-pulse">Waiting for the host to start...</p>
        )}
      </div>
    </div>
  )
}