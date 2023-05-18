import React, { useState, useEffect } from 'react'
import { ListGroup, Button } from 'react-bootstrap'

import configStore from '../../stores/config'
import authStore from '../../stores/auth'
import AppNavbar from '../../components/AppNavbar'
import Actuator from '../../components/Actuator'

import { queryFetch } from '../../utils'
import { Client } from '../../types'

interface ActuatorProps {
    input: string
}

export default function ActuatorPage({ input }: ActuatorProps) {
    const config = configStore(state => ({ ...state }))
    const token = authStore(state => state.token)
    const [clients, setClients] = useState<Client[]>([])

    useEffect(() => {
        const names = input.split(',').map(e => decodeURI(e).trim())
        fetch(`${config.address}/api/client/all`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                if (res.status === 200) return res.json()
                throw new Error('error while fetching clients infos')
            })

            .then(clients => clients as Client[])
            .then(clients =>
                clients.filter(client => names.includes(client.name))
            )
            .then(clients => setClients(clients))
    }, [input])

    return (
        <div className='w-100 h-100 d-flex flex-column'>
            <AppNavbar />
            <div className='w-100 h-100 d-flex flex-row flex-wrap justify-content-center'>
                {clients.map((client, clientI) => (
                    <Actuator
                        key={clientI}
                        client={client}
                        width='30%'
                        height='40%'
                    />
                ))}
            </div>
        </div>
    )
}
