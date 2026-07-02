export const API_URL = process.env.NEXT_PUBLIC_API_URL!

export async function login(email: string, pwd: string) {
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, pwd })
    })
    if (!response.ok) {
        throw new Error("Invalid email or password")
    }
    return response.json()
}

export async function logout() {
    return fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include"
    })
}

export async function getCurrentUser() {
    const response = await fetch(`${API_URL}/me`, {
        credentials: "include"
    })
    if (!response.ok) return null
    return response.json()
}

export async function updateProfile(userId: string, data: { email?: string, skills?: any[] }) {
    const response = await fetch(`${API_URL}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
    })
    if (!response.ok) {
        throw new Error("Failed to update profile")
    }
    return response.json()
}

export async function changePassword(oldPassword: string, newPassword: string) {
    const response = await fetch(`${API_URL}/me/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
    })
    if (!response.ok) {
        throw new Error("Failed to change password")
    }
    return response.json()
}