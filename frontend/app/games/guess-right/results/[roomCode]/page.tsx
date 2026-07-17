"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/api"
import { getGame } from "@/lib/guessRightApi"

export default function ResultsPage() {
    const params = useParams()
    const roomCode = params.roomCode as string
    const router = useRouter()

    const [user, setUser] = useState<any>(null)
    const [game, setGame] = useState<any>(null)

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

    useEffect(() => {
        if (!user) return
        getGame(roomCode)
            .then((data: any) => setGame(data))
            .catch(() => router.push("/games/guess-right"))
    }, [user, roomCode, router])

    if (!user || !game) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500 animate-pulse">Loading...</p>
            </div>
        )
    }

    const sorted = Object.entries(game.total_scores).sort(([, a]: any, [, b]: any) => b - a)
    const winner = sorted[0]
    const medals = ["🥇", "🥈", "🥉"]

    return (
        <div className="min-h-screen p-8 flex justify-center">
            <div className="w-full max-w-lg space-y-6">
                <div className="border rounded p-6 text-center bg-yellow-50">
                    <p className="text-gray-500 text-sm mb-2">🎉 The game is over!</p>
                    <div className="text-6xl mb-2">🏆</div>
                    <p className="text-3xl font-black text-yellow-600">{winner?.[0] as string}</p>
                    <p className="text-gray-500">{winner?.[1] as number} points</p>
                </div>

                <div className="border rounded p-6">
                    <h2 className="font-bold text-xl mb-4">Final standings</h2>
                    <div className="space-y-3">
                        {sorted.map(([player, score]: any, i: number) => (
                            <div
                                key={player}
                                className={`flex items-center gap-3 rounded px-4 py-3 ${player === user.name ? "bg-blue-50 border border-blue-200" : "bg-gray-100"}`}
                            >
                                <span className="text-2xl">{medals[i] || `${i + 1}.`}</span>
                                <span className="font-bold flex-1 text-lg">{player}</span>
                                <span className="font-black text-xl text-blue-600">{score} pts</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border rounded p-6">
                    <h2 className="font-bold text-xl mb-4">Rounds recap</h2>
                    <div className="space-y-4">
                        {game.rounds.map((round: any, i: number) => (
                            <div key={i} className="bg-gray-100 rounded p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-500 text-sm">Round {i + 1}</span>
                                    <span className="font-bold text-blue-600">{round.topic}</span>
                                </div>
                                <div className="flex items-center gap-2 mb-3 text-sm">
                                    <span className="bg-gray-200 px-2 py-1 rounded">🎤 {round.clue_giver}</span>
                                    <span className="text-yellow-600 font-bold">&quot;{round.clue_word}&quot;</span>
                                    <span className="ml-auto text-gray-500">Secret: <span className="font-bold">{round.secret_number}</span></span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>{round.word_low || "?"}</span>
                                    <span>↔</span>
                                    <span>{round.word_high || "?"}</span>
                                </div>
                                <div className="space-y-1">
                                    {Object.entries(round.guesses || {})
                                        .sort(([, a]: any, [, b]: any) => b - a)
                                        .map(([player, g]: any) => {
                                            const diff = Math.abs(g - round.secret_number)
                                            const pct = (g / 10) * 100
                                            return (
                                                <div key={player} className="flex items-center gap-2">
                                                    <span className="text-xs w-20 truncate">{player}</span>
                                                    <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
                                                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                                                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-red-400 rounded-full border-2 border-white"
                                                            style={{ left: `${(round.secret_number / 10) * 100}%` }} />
                                                    </div>
                                                    <span className="text-xs w-4">{g}</span>
                                                    <span className={`text-xs w-12 text-right ${diff <= 1 ? "text-green-600" : diff <= 3 ? "text-yellow-600" : "text-red-600"}`}>
                                                        +{round.scores?.[player] ?? 0}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <button className="bg-blue-500 text-white px-4 py-2 rounded w-full" onClick={() => router.push("/games/guess-right")}>
                    🎮 Play again
                </button>
            </div>
        </div>
    )
}
