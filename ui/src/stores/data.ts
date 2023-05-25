import { create } from 'zustand'
import { Client, Group } from '../types'
import configStore from './config'
import authStore from './auth'

interface dataType {
    clients: Client[]
    groups: Group[]
    refetchClients: () => void
    refetchGroups: () => void
}

const store = create<dataType>(set => {
    const fetchClient = () => {
        const config = configStore.getState()
        const auth = authStore.getState()
        if (!auth.isConnected) return
        fetch(`${config.address}/api/client/all`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${auth.token}` }
        })
            .then(res => res.json())
            .then(res => {
                set({ clients: res })
            })
    }
    const fetchGroups = () => {
        const config = configStore.getState()
        const auth = authStore.getState()
        if (!auth.isConnected) return
        fetch(`${config.address}/api/group/all`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${auth.token}` }
        })
            .then(res => res.json())
            .then(res => {
                set({ groups: res })
            })
    }

    fetchClient()
    fetchGroups()

    return {
        clients: [],
        groups: [],
        refetchClients: fetchClient,
        refetchGroups: fetchGroups
    }
})

export default store
