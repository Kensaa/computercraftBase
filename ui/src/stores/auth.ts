import create from 'zustand'

interface LoginResponse {
    token?: string
    user?: User
}
interface User {
    id: number
    username: string
}

interface authType {
    token: string
    user: User
    isConnected: boolean
    login: (loginResponse: LoginResponse) => void
    logout: () => void
}

const getLocalStorage = (key: string) => {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : undefined
}

const setLocalStorage = (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value))
}

const removeLocalStorage = (key: string) => localStorage.removeItem(key)

export default create<authType>(set => ({
    token: getLocalStorage('token') || undefined,
    user: getLocalStorage('user') || undefined,
    isConnected: getLocalStorage('token') !== undefined,
    login: (loginResponse: LoginResponse) => {
        setLocalStorage('token', loginResponse.token)
        setLocalStorage('user', loginResponse.user)
        set({...loginResponse, isConnected: true})
    },
    logout: () => {
        removeLocalStorage('token')
        removeLocalStorage('user')
        set({ token: undefined, user: undefined, isConnected: false })
    },
}))

