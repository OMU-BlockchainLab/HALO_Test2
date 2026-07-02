"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { API_URL } from "@/lib/api"

export default function BeaconRegisterPage() {
    const router = useRouter()
    const [name, setName] = useState("")
    const [address, setAddress] = useState("")
    const [capacity, setCapacity] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    async function handleSubmit() {
        if (!name.trim()) { setError("Venue name is required"); return }
        if (!address.trim()) { setError("Address is required"); return }
        if (!capacity || parseInt(capacity) <= 0) { setError("Capacity must be a positive number"); return }

        setError("")
        const response = await fetch(`${API_URL}/beacons`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                address,
                capacity: parseInt(capacity)
            })
        })

        if (!response.ok) { setError("Failed to register venue"); return }
        setSuccess(true)
        setTimeout(() => router.push("/"), 2000)
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-bold">Register your venue</h1>
        <p className="text-gray-500">Join HALO as a meeting point</p>

        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-500">Venue registered! Redirecting...</p>}

        <input
            className="border p-2 rounded w-80"
            placeholder="Venue name"
            value={name}
            onChange={e => setName(e.target.value)}
        />
        <input
            className="border p-2 rounded w-80"
            placeholder="Address"
            value={address}
            onChange={e => setAddress(e.target.value)}
        />
        <input
            className="border p-2 rounded w-80"
            type="number"
            placeholder="Capacity"
            value={capacity}
            onChange={e => setCapacity(e.target.value)}
        />
        <button
            onClick={handleSubmit}
            className="bg-purple-500 text-white px-4 py-2 rounded"
        >
            Register venue
        </button>
        </div>
    )
}