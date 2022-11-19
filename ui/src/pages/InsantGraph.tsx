import React, { useState, useEffect } from 'react'

import configStore from '../stores/config'
import authStore from '../stores/auth'
import AppNavbar from '../components/AppNavbar'

import { queryFetch } from '../utils'

interface GraphProps {
    input: string
}

interface Client {
    dbid: number
    id: string
    clientType: string
    dataType: {
        type: string
        unit: string
        keys: string[]
    }
    connected: boolean
}

export default function InsantGraph({ input }: GraphProps) {
    const config = configStore(state => ({ ...state }))
    const token = authStore(state => state.token)
    const [ids, setIds] = useState<string[]>([])
    const [clients, setClients] = useState<Client[]>([])

    
    useEffect(() => {
        setIds(input.split(',').map(e => decodeURI(e).trim()))
    }, [input])

    useEffect(() => {
        if(ids.length === 0) return

        queryFetch(
            `${config.address}/api/client/get`, 
            { method: 'GET', headers: { 'Authorization': `Bearer ${token}` }},
            { query: JSON.stringify(ids) }
        )
        .then(res => {
            if(res.status === 200) return res.json()
            throw new Error('error while fetching clients infos')
        }).then(data => setClients(data))
    }, [ids])

    return (
        <div className='w-100 h-100 d-flex flex-column'>
            <AppNavbar />
            <div className="w-100 h-100 d-flex flex-row flex-wrap justify-content-center">
                WIP
                (probably will never be done)
            </div>
        </div>
    )
}