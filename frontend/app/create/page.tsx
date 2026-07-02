"use client"
import {useState} from "react"
import {useRouter} from "next/navigation"
import { API_URL } from "@/lib/api"

export default function CreateUserPage() {
    const router = useRouter()

    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [age, setAge] = useState("")
    const [gender, setGender] = useState("")

    const [image, setImage] = useState<File | null>(null)
    const [form, setForm] = useState({
        name: "",
        email: "",
        age: "",
        gender: ""
    })

    const [txtError, setTxtError] = useState("")
    const [imgError, setImgError] = useState("")

    function validateTextForm() {
        if (!name.trim()) return "Name is required"
        if (!email.trim()) return "Email is required"
        if (!age) return "Age is required"
        return null
    }

    function validateImageForm() {
        if (!form.name.trim()) return "Name is required"
        if (!form.email.trim()) return "Email is required"
        if (!form.age) return "Age is required"
        return null
    }
    
    async function createUser() {
        const error = validateTextForm()
        if (error) {
            setTxtError(error)
            return
        }
        setTxtError("")
        const user = {
            name,
            email,
            age: Number(age),
            gender: Number(gender),
        }
        const response = await fetch(`${API_URL}/users`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(user)
        })
        const data = await response.json()
        console.log("User created:", data)
        router.push("/")
    }

    async function createUserWithImage() {
        const error = validateImageForm()
        if (error) {
            setImgError(error)
            return
        }
        setImgError("")
        const user = {
            name: form.name,
            email: form.email,
            age: Number(form.age),
            gender: Number(form.gender),
        }

        const response = await fetch(`${API_URL}/users`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(user)
        })
        const data = await response.json()
        console.log("User created:", data)
        router.push("/")
    }

    async function uploadImage() {
        if (!image) {
            alert("Please select an image to upload")
            return
        }
        const formData = new FormData()
        formData.append("file", image)
        const response = await fetch(`${API_URL}/upload`, {
            method: "POST",
            body: formData
        })
        const data = await response.json()
        console.log("Image uploaded:", data)
        setForm(data)
    }

    return (
        <div>
            <div className="mt-6 p-4 border rounded-lg shadow-sm flex flex-col gap-3 w-80">   
                <h1>Create User</h1>
                {txtError && <p className="text-red-500">{txtError}</p>}
                <div>
                    <p>Name:</p>
                    <input value={name} onChange={e => setName(e.target.value)} className="border border-gray-300 rounded px-3 py-2"/>
                </div>
                <div>
                    <p>Email:</p>
                    <input value={email} onChange={e => setEmail(e.target.value)} className="border border-gray-300 rounded px-3 py-2"/>
                </div>
                <div>
                    <p>Age:</p>
                    <input value={age} onChange={e => setAge(e.target.value)} className="border border-gray-300 rounded px-3 py-2"/>
                </div>
                <div>
                    <p>Gender:</p>
                    <select value={gender} onChange={e => setGender(e.target.value)} className="border border-gray-300 rounded px-3 py-2">
                        <option value={0}>M</option>
                        <option value={1}>F</option>
                        <option value={2}>Other</option>
                    </select>
                </div>

                <button onClick={createUser} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
                    Create User
                </button>
            </div>
            <div className="mt-6 p-4 border rounded-lg shadow-sm flex flex-col gap-3 w-80">
                <div>
                    <p>Image</p>
                    <input type="file" onChange={(e) => {
                        if (e.target.files?.[0]) {
                            setImage(e.target.files[0])
                        }
                    }} />
                </div>
                <button onClick={uploadImage} className="mt-4 px-4 py-2 bg-purple-500 text-white rounded">
                    Upload Image
                </button>
                {imgError && <p className="text-red-500">{imgError}</p>}
                <div className="mt-4">
                    <input placeholder="Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="border border-gray-300 rounded px-3 py-2"/>
                </div>
                <div className="mt-2">
                    <input placeholder="Email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="border border-gray-300 rounded px-3 py-2" />
                </div>
                <div className="mt-2">
                    <input placeholder="Age" value={form.age} onChange={(e) => setForm({...form, age: e.target.value})} className="border border-gray-300 rounded px-3 py-2" />
                </div>
                <div className="mt-2">
                    <select value={form.gender} onChange={(e) => setForm({...form, gender: (e.target.value)})} className="border border-gray-300 rounded px-3 py-2">
                        <option value={0}>M</option>
                        <option value={1}>F</option>
                        <option value={2}>Other</option>
                    </select>
                </div>
                <button onClick={createUserWithImage} className="mt-4 px-4 py-2 bg-green-500 text-white rounded">
                    Create User with Image Data
                </button>
            </div>
        </div>
    )
}