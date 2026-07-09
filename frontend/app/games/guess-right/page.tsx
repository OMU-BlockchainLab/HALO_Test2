"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/lib/api"
import { createGame, joinGame } from "@/lib/gamesApi"

export default function GuessRightHomePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [roomCode, setRoomCode] = useState("")
    const [error, setError] = useState("")
    const [busy, setBusy] = useState("")

    useEffect(() => {
        async function checkAuth() {
            const currentUser = await getCurrentUser()
            if (!currentUser) {
                router.push("/login")
                return
            }
            setLoading(false)
        }
        checkAuth()
    }, [router])

    async function handleCreate() {
        setError("")
        setBusy("create")
        try {
            const data = await createGame()
            router.push(`/games/guess-right/lobby/${data.room_code}`)
        } catch (err: any) {
            setError(err.message || "Error creating game")
        } finally {
            setBusy("")
        }
    }

    async function handleJoin(e: React.FormEvent) {
        e.preventDefault()
        if (!roomCode.trim()) return
        setError("")
        setBusy("join")
        try {
            await joinGame(roomCode.toUpperCase())
            router.push(`/games/guess-right/lobby/${roomCode.toUpperCase()}`)
        } catch (err: any) {
            setError(err.message || "Error joining game")
        } finally {
            setBusy("")
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Loading...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-8 flex flex-col items-center">
            <div className="w-full max-w-lg space-y-6">
                <div className="flex justify-between items-center">
                    <Link href="/games" className="text-blue-500 hover:underline text-sm">
                        &larr; All games
                    </Link>
                </div>

                <div className="text-center">
                    <h1 className="text-4xl font-black mb-2">🎯 Guess Right</h1>
                    <p className="text-gray-600">
                        The social game where AI generates the topics and you guess each
                        other&apos;s numbers
                    </p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-300 text-red-700 rounded p-3 text-sm text-center">
                        {error}
                    </div>
                )}

                <div className="border rounded p-6">
                    <h2 className="text-xl font-bold mb-1">🚀 Create a game</h2>
                    <p className="text-gray-600 text-sm mb-4">
                        You&apos;ll be the host. Share the code with your friends.
                    </p>
                    <button
                        className="bg-blue-500 text-white px-4 py-2 rounded w-full disabled:opacity-50"
                        onClick={handleCreate}
                        disabled={busy === "create"}
                    >
                        {busy === "create" ? "Creating..." : "Create a game"}
                    </button>
                </div>

                <div className="border rounded p-6">
                    <h2 className="text-xl font-bold mb-1">🔗 Join a game</h2>
                    <p className="text-gray-600 text-sm mb-4">
                        Enter the game code shared by the host.
                    </p>
                    <form onSubmit={handleJoin} className="flex gap-2">
                        <input
                            className="border p-2 rounded flex-1 uppercase tracking-widest font-mono text-lg"
                            placeholder="CODE"
                            value={roomCode}
                            maxLength={6}
                            onChange={e => setRoomCode(e.target.value.toUpperCase())}
                        />
                        <button
                            className="bg-blue-500 text-white px-4 py-2 rounded whitespace-nowrap disabled:opacity-50"
                            type="submit"
                            disabled={busy === "join" || !roomCode.trim()}
                        >
                            {busy === "join" ? "..." : "Join"}
                        </button>
                    </form>
                </div>

                <div className="border rounded p-6">
                    <h2 className="text-lg font-bold mb-3">📖 How to play</h2>
                    <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
                        <li>The AI generates a topic and 2 opposite words (e.g. Healthy ↔ Junk food, from 0 to 10)</li>
                        <li>The selected player sees a secret number between 1 and 10</li>
                        <li>They say a single word to guide the others</li>
                        <li>The others guess the number on the slider</li>
                        <li>The closer you are, the more points you score!</li>
                    </ol>
                </div>
            </div>
        </div>
    )
}
