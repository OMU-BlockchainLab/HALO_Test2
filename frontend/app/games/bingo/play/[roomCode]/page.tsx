"use client"
import { use, useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/api"
import { getBingo, checkCell } from "@/lib/bingoApi"

const WINNING_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
]

function getWinningCells(cells: any[]): number[] {
  for (const line of WINNING_LINES) {
    if (line.every(i => cells[i]?.checked)) return line
  }
  return []
}

export default function BingoPlayPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = use(params)
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [game, setGame] = useState<any>(null)
  const [error, setError] = useState("")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
      if (data.status === "finished" && pollRef.current) {
        clearInterval(pollRef.current)
      }
    } catch { setError("Connection error") }
  }, [roomCode])

  useEffect(() => {
    if (!user) return
    fetchGame()
    pollRef.current = setInterval(fetchGame, 2000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [user, fetchGame])

  async function handleCheck(index: number) {
    if (!game || game.my_grid[index]?.checked || game.status === "finished") return
    try {
      const data = await checkCell(roomCode, index)
      setGame(data)
    } catch (err: any) { setError(err.message) }
  }

  if (!user || !game) return <div className="min-h-screen flex items-center justify-center"><p className="animate-pulse">Loading...</p></div>

  const grid = game.my_grid || []
  const winningCells = game.status === "finished" ? getWinningCells(grid) : []
  const iWon = game.winner === user.name

  return (
    <div className="min-h-screen p-8 flex flex-col items-center gap-6">
      <div className="w-full max-w-md">
        <button className="text-green-600 hover:underline text-sm" onClick={() => router.push("/games/bingo")}>&larr; Leave</button>
      </div>

      {error && <div className="bg-red-100 border border-red-300 text-red-700 rounded p-3 text-sm">{error}</div>}

      {game.status === "finished" && (
        <div className={`w-full max-w-md border rounded p-6 text-center ${iWon ? "bg-yellow-50 border-yellow-300" : "bg-gray-50"}`}>
          {iWon ? (
            <>
              <div className="text-5xl mb-2">🎉</div>
              <p className="text-2xl font-black text-yellow-600">BINGO! You won!</p>
            </>
          ) : (
            <>
              <div className="text-4xl mb-2">🏆</div>
              <p className="text-xl font-bold"><span className="text-yellow-600">{game.winner}</span> got bingo first!</p>
            </>
          )}
        </div>
      )}

      <div className="w-full max-w-md">
        <h2 className="font-bold text-lg mb-3 text-center">Your grid</h2>
        <div className="grid grid-cols-3 gap-2">
          {grid.map((cell: any, i: number) => {
            const isWinning = winningCells.includes(i)
            return (
              <button
                key={i}
                onClick={() => handleCheck(i)}
                disabled={cell.checked || game.status === "finished"}
                className={`
                  aspect-square p-2 rounded border text-xs font-medium text-center transition
                  flex items-center justify-center leading-tight
                  ${cell.checked && isWinning ? "bg-yellow-400 border-yellow-500 text-yellow-900" : ""}
                  ${cell.checked && !isWinning ? "bg-green-100 border-green-400 text-green-800 line-through" : ""}
                  ${!cell.checked ? "bg-white border-gray-300 hover:border-green-400 hover:shadow cursor-pointer" : ""}
                `}
              >
                {cell.checked && <span className="mr-1">✓ </span>}
                {cell.proposition}
              </button>
            )
          })}
        </div>
        <p className="text-gray-400 text-xs text-center mt-3">Tap a square when you find a match!</p>
      </div>

      <div className="w-full max-w-md border rounded p-4">
        <h3 className="font-bold text-sm text-gray-600 mb-2">Players in game</h3>
        <div className="flex flex-wrap gap-2">
          {game.players.map((p: string) => (
            <span key={p} className={`px-3 py-1 rounded-full text-sm ${p === user.name ? "bg-green-100 text-green-800 font-bold" : "bg-gray-100 text-gray-600"}`}>
              {p === game.winner ? "🏆 " : ""}{p}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}