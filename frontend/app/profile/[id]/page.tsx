"use client"
import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/lib/api"
import { API_URL } from "@/lib/api"

const LEVEL_LABELS: Record<number, string> = {
  1: "Wants to learn",
  2: "Beginner",
  3: "Intermediate",
  4: "Advanced",
  5: "Proficient"
}

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [profile, setProfile] = useState<any>(null)
    const [isOwnProfile, setIsOwnProfile] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
        const [currentUser, profileRes] = await Promise.all([
            getCurrentUser(),
            fetch(`${API_URL}/users/${id}`)
        ])
        if (!currentUser) { router.push("/login"); return }
        if (!profileRes.ok) { router.push("/dashboard"); return }
        const profileData = await profileRes.json()
        setProfile(profileData)
        setIsOwnProfile(currentUser.id === id)
        setLoading(false)
        }
        load()
    }, [id, router])

      if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>

  return (
    <div className="p-8 max-w-xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{profile.name}</h1>
          <p className="text-gray-500">{profile.age} yo · {["Male", "Female", "Other"][profile.gender]}</p>
        </div>
        {isOwnProfile && (
          <Link href="/profile/edit" className="bg-green-500 text-white px-4 py-2 rounded">
            Edit
          </Link>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-3">Skills & Hobbies</h2>
        {profile.skills?.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((s: any) => (
              <span key={s.name} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                #{s.name} · {LEVEL_LABELS[s.level]}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No skills yet.</p>
        )}
      </div>

      <button onClick={() => router.back()} className="text-gray-500 underline self-start">
        ← Back
      </button>
    </div>
  )
}