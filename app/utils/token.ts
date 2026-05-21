import axios from "axios"

export function SaveToken(token: string) {
    localStorage.setItem("store_token", token)
}

export const Api = process.env.NEXT_PUBLIC_API

export const MyAxios = axios.create({
    baseURL: Api
})

export function GetToken() {
    if(typeof window != "undefined"){

        return localStorage.getItem("store_token")
    }
    return ""
}

// ✅ Достаём userId из JWT токена
export function GetUserId(): string | null {
    const token = GetToken()
    if (!token) return null
    try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        return payload.sid
        // JWT может хранить id под разными ключами
        return payload.nameid || payload.sub || payload.userId || payload.id || null
    } catch {
        return null
    }
}

MyAxios.interceptors.request.use(
    (config) => {
        const token = GetToken()
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)