"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/lib/api"
import { createBingo, joinBingo } from "@/lib/bingoApi"

export default function BingoHomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [roomCode, setRoomCode] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState("")

  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser()
      if (!user) { router.push("/login"); return }
      setLoading(false)
    }
    checkAuth()
  }, [router])

  async function handleCreate() {
    setError(""); setBusy("create")
    try {
      const data = await createBingo()
      router.push(`/games/bingo/lobby/${data.room_code}`)
    } catch (err: any) {
      setError(err.message)
    } finally { setBusy("") }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!roomCode.trim()) return
    setError(""); setBusy("join")
    try {
      await joinBingo(roomCode.toUpperCase())
      router.push(`/games/bingo/lobby/${roomCode.toUpperCase()}`)
    } catch (err: any) {
      setError(err.message)
    } finally { setBusy("") }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>

  return (
    <div className="min-h-screen p-8 flex flex-col items-center">
      <div className="w-full max-w-lg space-y-6">
        <Link href="/games" className="text-blue-500 hover:underline text-sm">&larr; All games</Link>

        <div className="text-center">
          <h1 className="text-4xl font-black mb-2">🟩 Social Bingo</h1>
          <p className="text-gray-600">Find people in the group who match each square. First to complete a line wins!</p>
        </div>

        {error && <div className="bg-red-100 border border-red-300 text-red-700 rounded p-3 text-sm text-center">{error}</div>}

        <div className="border rounded p-6">
          <h2 className="text-xl font-bold mb-1">🚀 Create a game</h2>
          <p className="text-gray-600 text-sm mb-4">You'll be the host. Share the code with your group.</p>
          <button className="bg-green-500 text-white px-4 py-2 rounded w-full disabled:opacity-50" onClick={handleCreate} disabled={busy === "create"}>
            {busy === "create" ? "Creating..." : "Create a game"}
          </button>
        </div>

        <div className="border rounded p-6">
          <h2 className="text-xl font-bold mb-1">🔗 Join a game</h2>
          <p className="text-gray-600 text-sm mb-4">Enter the code shared by the host.</p>
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              className="border p-2 rounded flex-1 uppercase tracking-widest font-mono text-lg"
              placeholder="CODE" value={roomCode} maxLength={6}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
            />
            <button className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50" type="submit" disabled={busy === "join" || !roomCode.trim()}>
              {busy === "join" ? "..." : "Join"}
            </button>
          </form>
        </div>

        <div className="border rounded p-6">
          <h2 className="text-lg font-bold mb-3">📖 How to play</h2>
          <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
            <li>The AI generates a personalised 3×3 grid for each player based on everyone's skills</li>
            <li>Go around and talk to the other players</li>
            <li>Check a square when you find someone who matches it</li>
            <li>First to complete a full row, column, or diagonal wins!</li>
          </ol>
        </div>
      </div>
    </div>
  )
}