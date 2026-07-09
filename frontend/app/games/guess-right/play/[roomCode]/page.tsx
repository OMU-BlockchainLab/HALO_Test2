"use client"
import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/api"
import { getGame, submitClue, submitGuess, getSecret } from "@/lib/gamesApi"

function Slider({ value, onChange, disabled, wordLow, wordHigh }: any) {
    return (
        <div className="w-full">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span className="font-medium text-blue-600">0 — {wordLow}</span>
                <span className="font-bold text-2xl">{value}</span>
                <span className="font-medium text-red-600">{wordHigh} — 10</span>
            </div>
            <input
                type="range" min={0} max={10} step={1}
                value={value}
                onChange={e => onChange(Number(e.target.value))}
                disabled={disabled}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <span key={n}>{n}</span>)}
            </div>
        </div>
    )
}

export default function PlayPage() {
    const params = useParams()
    const roomCode = params.roomCode as string
    const router = useRouter()

    const [user, setUser] = useState<any>(null)
    const [game, setGame] = useState<any>(null)
    const [secretNumber, setSecretNumber] = useState<number | null>(null)
    const [clueWord, setClueWord] = useState("")
    const [guess, setGuess] = useState(5)
    const [submittedGuess, setSubmittedGuess] = useState(false)
    const [submittedClue, setSubmittedClue] = useState(false)
    const [error, setError] = useState("")
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
            if (data.status === "finished") {
                if (pollRef.current) clearInterval(pollRef.current)
                router.push(`/games/guess-right/results/${roomCode}`)
            }
        } catch {
            setError("Connection error")
        }
    }, [roomCode, router])

    useEffect(() => {
        if (!user) return
        fetchGame()
        pollRef.current = setInterval(fetchGame, 2000)
        return () => { if (pollRef.current) clearInterval(pollRef.current) }
    }, [user, fetchGame])

    // Reset local state when the round changes
    useEffect(() => {
        if (!game) return
        setSubmittedGuess(false)
        setSubmittedClue(false)
        setClueWord("")
        setGuess(5)
    }, [game?.current_round])

    // Fetch the secret number when it's our turn as clue giver
    useEffect(() => {
        if (!game || !user) return
        if (game.current_clue_giver === user.name && game.status === "active") {
            getSecret(roomCode)
                .then((data: any) => setSecretNumber(data.secret_number))
                .catch(() => setSecretNumber(null))
        } else {
            setSecretNumber(null)
        }
    }, [game?.current_clue_giver, game?.current_round, roomCode, user])

    if (!user || !game) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500 animate-pulse">Loading...</p>
            </div>
        )
    }

    const isClueGiver = game.current_clue_giver === user.name
    const currentTopic = game.current_topic
    const otherPlayers = game.players.filter((p: string) => p !== game.current_clue_giver)
    const iHaveGuessed = user.name in game.current_guesses

    async function handleSubmitClue() {
        if (!clueWord.trim()) return
        setError("")
        try {
            await submitClue(roomCode, clueWord.trim())
            setSubmittedClue(true)
            await fetchGame()
        } catch (err: any) {
            setError(err.message || "Error")
        }
    }

    async function handleSubmitGuess() {
        setError("")
        try {
            await submitGuess(roomCode, guess)
            setSubmittedGuess(true)
            await fetchGame()
        } catch (err: any) {
            setError(err.message || "Error")
        }
    }

    return (
        <div className="min-h-screen p-8 flex justify-center">
            <div className="w-full max-w-lg space-y-4">
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
                <div className="border rounded flex items-center justify-between py-3 px-4">
                    <span className="text-gray-500 text-sm">Round {game.current_round + 1} / {game.total_rounds}</span>
                    <div className="flex gap-1">
                        {Array.from({ length: game.total_rounds }).map((_, i) => (
                            <div key={i} className={`w-6 h-2 rounded-full ${i < game.current_round ? "bg-blue-500" : i === game.current_round ? "bg-blue-300" : "bg-gray-200"}`} />
                        ))}
                    </div>
                    <span className="text-gray-500 text-sm">Code: <span className="font-mono font-bold">{roomCode}</span></span>
                </div>

                <div className="border rounded p-4 text-center">
                    <p className="text-gray-500 text-sm mb-1">Clue Giver this round</p>
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                            {game.current_clue_giver?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-2xl font-black">
                            {isClueGiver ? "🎤 You!" : game.current_clue_giver}
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-300 text-red-700 rounded p-3 text-sm">{error}</div>
                )}

                {isClueGiver && (
                    <div className="border rounded p-6 space-y-4">
                        <h2 className="font-bold text-xl text-center text-yellow-600">🎤 It&apos;s your turn!</h2>

                        {currentTopic && (
                            <div className="bg-gray-100 rounded p-4 text-center">
                                <p className="text-gray-500 text-sm mb-1">Topic</p>
                                <p className="text-2xl font-black text-blue-600">{currentTopic.topic}</p>
                                <div className="flex justify-between text-sm mt-2">
                                    <span className="text-blue-600">0 = {currentTopic.word_low}</span>
                                    <span className="text-red-600">{currentTopic.word_high} = 10</span>
                                </div>
                            </div>
                        )}

                        <div className="bg-blue-50 border border-blue-200 rounded p-4 text-center">
                            <p className="text-gray-600 text-sm mb-1">Your secret number</p>
                            <p className="text-6xl font-black text-blue-600">
                                {secretNumber ?? "..."}
                            </p>
                            <p className="text-gray-500 text-xs mt-2">Don&apos;t tell the others!</p>
                        </div>

                        {!submittedClue && !game.current_clue_word ? (
                            <div className="space-y-3">
                                <p className="text-gray-700 text-sm">Say ONE single word that matches your number:</p>
                                <input
                                    className="border p-2 rounded w-full text-lg font-bold text-center tracking-wide"
                                    placeholder="Your word..."
                                    value={clueWord}
                                    onChange={e => setClueWord(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleSubmitClue()}
                                />
                                <button className="bg-blue-500 text-white px-4 py-2 rounded w-full disabled:opacity-50" onClick={handleSubmitClue} disabled={!clueWord.trim()}>
                                    Submit my word
                                </button>
                            </div>
                        ) : (
                            <div className="bg-green-50 border border-green-300 rounded p-4 text-center">
                                <p className="text-green-700 font-bold">✅ Word submitted: &quot;{game.current_clue_word || clueWord}&quot;</p>
                                <p className="text-gray-500 text-sm mt-1">Waiting for the others to guess...</p>
                            </div>
                        )}
                    </div>
                )}

                {!isClueGiver && (
                    <div className="border rounded p-6 space-y-4">
                        {!game.current_clue_word ? (
                            <div className="text-center py-4">
                                <p className="text-gray-500 animate-pulse text-lg">
                                    ⏳ Waiting for <span className="font-bold">{game.current_clue_giver}</span> to choose their word...
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="text-center">
                                    <p className="text-gray-500 text-sm mb-1">Topic</p>
                                    <p className="text-2xl font-bold text-blue-600">{currentTopic?.topic}</p>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-300 rounded p-4 text-center">
                                    <p className="text-gray-600 text-sm mb-1">Clue word from {game.current_clue_giver}</p>
                                    <p className="text-4xl font-black text-yellow-600">&quot;{game.current_clue_word}&quot;</p>
                                </div>

                                <div className="space-y-3">
                                    <Slider
                                        value={guess}
                                        onChange={setGuess}
                                        disabled={submittedGuess || iHaveGuessed}
                                        wordLow={currentTopic?.word_low || "0"}
                                        wordHigh={currentTopic?.word_high || "10"}
                                    />
                                    {!submittedGuess && !iHaveGuessed ? (
                                        <button className="bg-blue-500 text-white px-4 py-2 rounded w-full" onClick={handleSubmitGuess}>
                                            Submit my answer: {guess}
                                        </button>
                                    ) : (
                                        <div className="bg-green-50 border border-green-300 rounded p-3 text-center">
                                            <p className="text-green-700 font-bold">✅ Answer submitted: {game.current_guesses[user.name]}</p>
                                            <p className="text-gray-500 text-sm">Waiting for the other players...</p>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-100 rounded p-3">
                                    <p className="text-gray-500 text-xs mb-2">Progress:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {otherPlayers.map((p: string) => (
                                            <div key={p} className={`px-3 py-1 rounded-full text-sm font-medium ${p in game.current_guesses ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
                                                {p in game.current_guesses ? "✓" : "⏳"} {p}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {game.rounds.length > 0 && (
                    <div className="border rounded p-4">
                        <h3 className="font-bold text-gray-700 mb-3">Previous round scores</h3>
                        <div className="space-y-2">
                            {Object.entries(game.rounds[game.rounds.length - 1].scores || {})
                                .sort(([, a]: any, [, b]: any) => b - a)
                                .map(([player, score]: any) => (
                                    <div key={player} className="flex items-center justify-between bg-gray-100 rounded px-4 py-2">
                                        <span className="font-medium">{player}</span>
                                        <span className="font-bold text-blue-600">+{score} pts</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                <div className="border rounded p-4">
                    <h3 className="font-bold text-gray-700 mb-3">🏆 Total scores</h3>
                    <div className="space-y-2">
                        {Object.entries(game.total_scores)
                            .sort(([, a]: any, [, b]: any) => b - a)
                            .map(([player, score]: any, i: number) => (
                                <div key={player} className="flex items-center gap-3 bg-gray-100 rounded px-4 py-2">
                                    <span className="text-gray-400 w-4">{i + 1}</span>
                                    <span className="font-medium flex-1">{player}</span>
                                    <span className="font-black text-lg text-blue-600">{score as number}</span>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
