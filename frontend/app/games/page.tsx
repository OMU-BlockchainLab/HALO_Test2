"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/lib/api"

export default function GamesPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)

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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Loading...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Icebreaker Games</h1>
                <Link href="/dashboard" className="text-blue-500 hover:underline">
                    &larr; Back to dashboard
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                    href="/games/guess-right"
                    className="border rounded p-6 hover:shadow-lg transition block"
                >
                    <h2 className="text-xl font-bold mb-2">🎯 Guess Right</h2>
                    <p>
                        AI generates a topic and two opposite words. One player gets a
                        secret number and gives a one-word clue — everyone else guesses!
                    </p>
                </Link>

                <Link href="/games/bingo" className="border rounded p-6 hover:shadow-lg transition block">
                    <h2 className="text-xl font-bold mb-2">🟩 Social Bingo</h2>
                    <p>AI generates a personalised bingo grid. Find people in the group who match each square!</p>
                </Link>

                <div className="border rounded p-6 opacity-50 cursor-not-allowed">
                    <h2 className="text-xl font-bold mb-2">More games</h2>
                    <p>Coming soon</p>
                </div>
            </div>
        </div>
    )
}
