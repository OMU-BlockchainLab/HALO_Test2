import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-5xl font-bold">HALO Project</h1>
      <p className="text-gray-600">Connect, share, and learn across generations</p>
      <div className="flex gap-4">
        <Link href="/login" className="px-4 py-2 bg-blue-500 text-white rounded">
          Login
        </Link>
        <Link href="/register" className="px-4 py-2 bg-green-500 text-white rounded">
          Register
        </Link>
        <Link href="/beacon/register" className="px-4 py-2 bg-purple-500 text-white rounded">
          Register a venue
        </Link>
      </div>
    </div>
  )
}