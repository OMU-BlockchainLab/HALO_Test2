"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getCurrentUser, logout } from "@/lib/api"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push("/login")
        return
      }
      setUser(currentUser)
      setLoading(false)
    }
    checkAuth()
  }, [router])

  async function handleLogout() {
    await logout()
    router.push("/")
  }

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
        <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/search" className="border rounded p-6 hover:shadow-lg transition block">
          <h2 className="text-xl font-bold mb-2">Search</h2>
          <p>Find other users by age and gender</p>
        </Link>

        <Link href={`/profile/${user.id}`} className="border rounded p-6 hover:shadow-lg transition block">
          <h2 className="text-xl font-bold mb-2">My Profile</h2>
          <p>Edit your info, skills, and hobbies</p>
        </Link>

        <Link href="/games" className="border rounded p-6 hover:shadow-lg transition block">
          <h2 className="text-xl font-bold mb-2">Icebreaker Games</h2>
          <p>Play a game with the other users</p>
        </Link>
      </div>
    </div>
  )
}