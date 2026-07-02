"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, updateProfile, changePassword } from "@/lib/api"

const PRESET_SKILLS = [
  "Cooking", "Programming", "Guitar", "Piano", "Drawing", "Photography",
  "Gardening", "Yoga", "Chess", "Writing", "Dancing", "Cycling",
  "Hiking", "Painting", "Knitting", "Woodworking", "Gaming", "Reading"
]

const LEVEL_LABELS: Record<number, string> = {
  1: "Wants to learn",
  2: "Beginner",
  3: "Intermediate",
  4: "Advanced",
  5: "Proficient"
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // email
  const [email, setEmail] = useState("")
  const [emailSuccess, setEmailSuccess] = useState(false)

  // password
  const [currentPwd, setCurrentPwd] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [pwdError, setPwdError] = useState("")
  const [pwdSuccess, setPwdSuccess] = useState(false)

  // skills
  const [skills, setSkills] = useState<{ name: string; level: number }[]>([])
  const [search, setSearch] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [pendingSkill, setPendingSkill] = useState<{ name: string; level: number } | null>(null)

  useEffect(() => {
    async function load() {
      const u = await getCurrentUser()
      if (!u) { router.push("/login"); return }
      setUser(u)
      setEmail(u.email)
      setSkills(u.skills || [])
      setLoading(false)
    }
    load()
  }, [router])

  const filteredSuggestions = PRESET_SKILLS.filter(s =>
    s.toLowerCase().includes(search.toLowerCase()) &&
    !skills.find(sk => sk.name.toLowerCase() === s.toLowerCase())
  )

  function selectSkill(name: string) {
    setPendingSkill({ name, level: 1 })
    setSearch("")
    setShowDropdown(false)
  }

  function confirmAddSkill() {
    if (!pendingSkill) return
    setSkills(prev => [...prev, pendingSkill])
    setPendingSkill(null)
  }

  function removeSkill(name: string) {
    setSkills(prev => prev.filter(s => s.name !== name))
  }

  async function saveEmail() {
    await updateProfile(user.id, { email })
    setEmailSuccess(true)
    setTimeout(() => setEmailSuccess(false), 2000)
  }

  async function savePassword() {
    setPwdError("")
    if (newPwd !== confirmPwd) { setPwdError("Passwords don't match"); return }
    try {
      await changePassword(currentPwd, newPwd)
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("")
      setPwdSuccess(true)
      setTimeout(() => setPwdSuccess(false), 2000)
    } catch {
      setPwdError("Wrong current password")
    }
  }

  async function saveSkills() {
    await updateProfile(user.id, { skills })
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>

  return (
    <div className="p-8 max-w-xl mx-auto flex flex-col gap-8">
      <h1 className="text-3xl font-bold">My Profile</h1>

      {/* Email */}
      <div className="border rounded p-4 flex flex-col gap-3">
        <h2 className="text-xl font-bold">Email</h2>
        <input
          className="border p-2 rounded"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <button onClick={saveEmail} className="bg-green-500 text-white px-4 py-2 rounded self-start">
          Save email
        </button>
        {emailSuccess && <p className="text-green-500">Saved!</p>}
      </div>

      {/* Password */}
      <div className="border rounded p-4 flex flex-col gap-3">
        <h2 className="text-xl font-bold">Change Password</h2>
        {pwdError && <p className="text-red-500">{pwdError}</p>}
        {pwdSuccess && <p className="text-green-500">Password updated!</p>}
        <input className="border p-2 rounded" type="password" placeholder="Current password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} />
        <input className="border p-2 rounded" type="password" placeholder="New password" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
        <input className="border p-2 rounded" type="password" placeholder="Confirm new password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
        <button onClick={savePassword} className="bg-green-500 text-white px-4 py-2 rounded self-start">
          Update password
        </button>
      </div>

      {/* Skills */}
      <div className="border rounded p-4 flex flex-col gap-3">
        <h2 className="text-xl font-bold">Skills & Hobbies</h2>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {skills.map(s => (
            <span key={s.name} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
              #{s.name} · {LEVEL_LABELS[s.level]}
              <button onClick={() => removeSkill(s.name)} className="text-blue-400 hover:text-red-500">×</button>
            </span>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <input
            className="border p-2 rounded w-full"
            placeholder="Add a skill..."
            value={search}
            onChange={e => { setSearch(e.target.value); setShowDropdown(true) }}
            onFocus={() => setShowDropdown(true)}
          />
          {showDropdown && search && (
            <div className="absolute z-10 bg-white border rounded w-full shadow max-h-48 overflow-y-auto">
              {filteredSuggestions.map(s => (
                <div key={s} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => selectSkill(s)}>
                  {s}
                </div>
              ))}
              {!filteredSuggestions.find(s => s.toLowerCase() === search.toLowerCase()) && (
                <div className="p-2 hover:bg-gray-100 cursor-pointer italic text-gray-500" onClick={() => selectSkill(search)}>
                  Add "{search}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pending skill slider */}
        {pendingSkill && (
          <div className="border rounded p-3 flex flex-col gap-2 bg-gray-50">
            <p className="font-medium">{pendingSkill.name}</p>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 w-28">Wants to learn</span>
              <input
                type="range" min={1} max={5} value={pendingSkill.level}
                onChange={e => setPendingSkill({ ...pendingSkill, level: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="text-sm text-gray-500 w-20">Proficient</span>
            </div>
            <p className="text-sm text-center text-blue-600">{LEVEL_LABELS[pendingSkill.level]}</p>
            <div className="flex gap-2">
              <button onClick={confirmAddSkill} className="bg-green-500 text-white px-3 py-1 rounded text-sm">Add</button>
              <button onClick={() => setPendingSkill(null)} className="bg-gray-200 px-3 py-1 rounded text-sm">Cancel</button>
            </div>
          </div>
        )}

        <button onClick={saveSkills} className="bg-green-500 text-white px-4 py-2 rounded self-start">
          Save skills
        </button>
      </div>
    </div>
  )
}