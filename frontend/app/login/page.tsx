"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { login } from "@/lib/api"

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [pwd, setPwd] = useState("")
    const [error, setError] = useState("")

    async function handleLogin() {
        if (!email.trim()) { setError("Email is required"); return }
        if (!pwd) { setError("Password is required"); return }
        setError("")
        try {
            await login(email, pwd)
            router.push("/dashboard")
        } catch {
            setError("Invalid email or password")
        }
    }
    
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <h1 className="text-3xl font-bold">Login</h1>
            {error && <p className="text-red-500">{error}</p>}
            <input
                className="border p-2 rounded w-80"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
            />
            <input
                className="border p-2 rounded w-80"
                type="password"
                placeholder="Password"
                value={pwd}
                onChange={e => setPwd(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
            <button onClick={handleLogin} className="bg-green-500 text-white px-4 py-2 rounded">
                Login
            </button>
        </div>
    )
}