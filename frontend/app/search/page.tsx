"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { API_URL } from "@/lib/api"

export default function SearchPage() {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [genderFilter, setGenderFilter] = useState("")
  const [minAge, setMinAge] = useState("")
  const [maxAge, setMaxAge] = useState("")

  async function loadUsers() {
    let url = `${API_URL}/users`
    const params = new URLSearchParams()
    if (genderFilter !== "") params.append("gender", genderFilter)
    if (minAge !== "") params.append("min_age", minAge)
    if (maxAge !== "") params.append("max_age", maxAge)
    if (params.toString()) url += "?" + params.toString()
    const response = await fetch(url)
    const data = await response.json()
    setUsers(data)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Search Users</h1>
      <div className="border rounded p-4 mb-4">
        <h2>Filters</h2>
        <div>
          <p>Gender</p>
          <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
            <option value="">All</option>
            <option value="0">M</option>
            <option value="1">F</option>
            <option value="2">Other</option>
          </select>
        </div>
        <div>
          <p>Minimum Age</p>
          <input type="number" value={minAge} onChange={(e) => setMinAge(e.target.value)} />
        </div>
        <div>
          <p>Maximum Age</p>
          <input type="number" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
        </div>
        <button onClick={loadUsers} className="mt-4 px-4 py-2 bg-green-500 text-white rounded">
          Filter
        </button>
      </div>
      {users.map((user: any) => (
        <div
          key={user.id}
          className="border rounded p-4 mb-4 shadow hover:shadow-lg transition cursor-pointer"
          onClick={() => router.push(`/profile/${user.id}`)}
        >
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="text-gray-500 text-sm">{user.age} yo · {["Male", "Female", "Other"][user.gender]}</p>
          {user.skills?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {user.skills.slice(0, 3).map((s: any) => (
                <span key={s.name} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                  #{s.name}
                </span>
              ))}
              {user.skills.length > 3 && (
                <span className="text-gray-400 text-xs self-center">+{user.skills.length - 3} more</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}