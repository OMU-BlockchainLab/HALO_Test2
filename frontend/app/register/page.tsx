"use client"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { API_URL } from "@/lib/api"

export default function RegisterPage() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [age, setAge] = useState("")
  const [gender, setGender] = useState("0")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [scanning, setScanning] = useState(false)

  async function handleScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setScanning(true)
    setError("")
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${API_URL}/upload`, {
      method: "POST",
      body: formData
    })

    if (!response.ok) {
      setError("OCR failed, please fill in manually")
      setScanning(false)
      return
    }

    const data = await response.json()
    if (data.name) setName(data.name)
    if (data.email) setEmail(data.email)
    if (data.age) setAge(String(data.age))
    if (data.gender !== undefined) setGender(String(data.gender))
    setScanning(false)
  }

  async function register() {
    if (!name.trim()) { setError("Name is required"); return }
    if (!email.trim()) { setError("Email is required"); return }
    if (!age.trim()) { setError("Age is required"); return }
    if (!password) { setError("Password is required"); return }
    if (password !== confirmPassword) { setError("Passwords do not match"); return }

    setError("")
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        age: parseInt(age, 10),
        gender: parseInt(gender, 10),
        pwd: password
      })
    })
    if (!response.ok) { setError("Registration failed"); return }
    router.push("/login")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Register</h1>
      {error && <p className="text-red-500">{error}</p>}

      {/* OCR */}

      <button
        className="border-2 border-dashed border-gray-300 px-6 py-3 rounded w-80 text-gray-500 hover:border-blue-400 hover:text-blue-400 transition"
      >
        {"📷 Scan ID card to autofill"}
      </button>

      <input className="border p-2 rounded w-80" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
      <input className="border p-2 rounded w-80" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input className="border p-2 rounded w-80" type="number" placeholder="Age" value={age} onChange={e => setAge(e.target.value)} />
      <select className="border p-2 rounded w-80" value={gender} onChange={e => setGender(e.target.value)}>
        <option value="0">Male</option>
        <option value="1">Female</option>
        <option value="2">Other</option>
      </select>
      <input className="border p-2 rounded w-80" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      <input className="border p-2 rounded w-80" type="password" placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />

      <button onClick={register} className="bg-green-500 text-white px-4 py-2 rounded w-80">
        Register
      </button>
    </div>
  )
}