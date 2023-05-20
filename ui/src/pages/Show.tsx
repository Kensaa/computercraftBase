import React, { createContext, useEffect, useState } from 'react'
import { Client, Data } from '../types'
import { useInterval } from 'usehooks-ts'

import configStore from '../stores/config'
import authStore from '../stores/auth'
import { queryFetch } from '../utils'
import AppNavbar from '../components/AppNavbar'
import Plot from '../components/clients/Plot'
import Actuator from '../components/clients/Actuator'

export interface DataContext {
    clients: Client[]
    data: Data
}
export const dataContext = createContext<DataContext>({
    clients: [],
    data: {}
})

interface ShowProps {
    input: string
}

const types = ['time-based grapher', 'instant grapher', 'actuator']

export default function Show({ input }: ShowProps) {
    const [clients, setClients] = useState<Client[]>([])
    const [data, setData] = useState<Data>({})

    const config = configStore(state => ({ ...state }))
    const token = authStore(state => state.token)

    useEffect(() => {
        const clientNames = input.split(',').map(e => decodeURI(e).trim())
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
                clients.filter(client => clientNames.includes(client.name))
            )
            .then(clients =>
                clients.sort(
                    (a, b) => types.indexOf(a.type) - types.indexOf(b.type)
                )
            )
            .then(clients => setClients(clients))
    }, [input])

    useInterval(() => {
        if (clients.length === 0) return
        queryFetch(
            `${config.address}/api/client/fetch`,
            { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
            { query: clients.map(e => e.name), count: 100 }
        )
            .then(res => {
                if (res.status === 200) return res.json()
                throw new Error('error while fetching data')
            })
            .then(data => setData(data))
    }, 1000)

    console.log(clients)
    return (
        <dataContext.Provider value={{ clients, data }}>
            <div className='w-100 h-100 d-flex flex-column'>
                <AppNavbar />
                <div
                    className='w-100 h-100 d-flex flex-row flex-wrap justify-content-center'
                    style={{ padding: '0.5rem' }}
                >
                    {clients.map((client, index) => {
                        const { type } = client
                        if (type === 'time-based grapher') {
                            return <Plot key={index} client={client} />
                        } else if (type === 'instant grapher') {
                            return <div className=''></div>
                        } else if (type === 'actuator') {
                            return <Actuator key={index} client={client} />
                        } else {
                            return <div>ERROR</div>
                        }
                    })}
                </div>
            </div>
        </dataContext.Provider>
    )
}
