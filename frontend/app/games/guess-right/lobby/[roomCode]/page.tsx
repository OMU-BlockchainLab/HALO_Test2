"use client"
import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/api"
import { getGame, startGame } from "@/lib/guessRightApi"

export default function LobbyPage() {
    const params = useParams()
    const roomCode = params.roomCode as string
    const router = useRouter()

    const [user, setUser] = useState<any>(null)
    const [game, setGame] = useState<any>(null)
    const [error, setError] = useState("")
    const [starting, setStarting] = useState(false)

    useEffect(() => {
        async function checkAuth() {
            const currentUser = await getCurrentUser()
            if (!currentUser) {
                router.push("/login")
                return
            }
            setUser(currentUser)
        }
        checkAuth()
    }, [router])

    const fetchGame = useCallback(async () => {
        try {
            const data = await getGame(roomCode)
            setGame(data)
            if (data.status === "active") {
                router.push(`/games/guess-right/play/${roomCode}`)
            }
            if (data.status === "finished") {
                router.push(`/games/guess-right/results/${roomCode}`)
            }
        } catch {
            setError("Game not found")
        }
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
            await startGame(roomCode)
            router.push(`/games/guess-right/play/${roomCode}`)
        } catch (err: any) {
            setError(err.message || "Unable to start")
            setStarting(false)
        }
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-red-600 text-xl">{error}</p>
                <button
                    className="bg-gray-500 text-white px-4 py-2 rounded"
                    onClick={() => router.push("/games/guess-right")}
                >
                    Back
                </button>
            </div>
        )
    }

    if (!user || !game) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500 animate-pulse">Loading...</p>
            </div>
        )
    }

    const isHost = game.host === user.name

    return (
        <div className="min-h-screen p-8 flex justify-center">
            <div className="border rounded p-6 w-full max-w-md">
                <div className="flex justify-between items-center">
                    <button
                        className="text-blue-500 hover:underline text-sm"
                        onClick={() => {
                            if (confirm("Leave the game? The game will continue for the other players.")) {
                                router.push("/games/guess-right")
                            }
                        }}
                    >
                        &larr; Leave game
                    </button>
                </div>
                <div className="text-center mb-6">
                    <p className="text-gray-600 text-sm mb-1">Game code</p>
                    <div className="text-4xl font-black font-mono tracking-widest text-blue-600 bg-blue-50 rounded py-3 px-6 inline-block">
                        {roomCode}
                    </div>
                    <p className="text-gray-500 text-xs mt-2">Share this code with your friends</p>
                </div>

                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-lg">Players</h2>
                        <span className="text-gray-500 text-sm">{game.players.length} connected</span>
                    </div>
                    <div className="space-y-2">
                        {game.players.map((player: string) => (
                            <div key={player} className="flex items-center gap-3 bg-gray-100 rounded px-4 py-3">
                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                                    {player[0].toUpperCase()}
                                </div>
                                <span className="font-medium">{player}</span>
                                {player === game.host && (
                                    <span className="ml-auto text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                                        Host
                                    </span>
                                )}
                                {player === user.name && (
                                    <span className="ml-auto text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                                        You
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {isHost ? (
                    <button
                        className="bg-blue-500 text-white px-4 py-2 rounded w-full disabled:opacity-50"
                        onClick={handleStart}
                        disabled={game.players.length < 2 || starting}
                    >
                        {starting ? "Starting..." : game.players.length < 2 ? "Waiting for players..." : "🚀 Start the game"}
                    </button>
                ) : (
                    <div className="text-center text-gray-500 py-3 animate-pulse">
                        Waiting for the host to start the game...
                    </div>
                )}
            </div>
        </div>
    )
}
