import React, { createContext, useEffect, useState } from 'react'
import { Client, Data, DataContext } from '../../types'
import { useInterval } from 'usehooks-ts'

import configStore from '../../stores/config'
import authStore from '../../stores/auth'
import dataStore from '../../stores/data'

import { queryFetch } from '../../utils'
import AppNavbar from '../../components/AppNavbar'
import Plot from '../../components/clients/Plot'
import Actuator from '../../components/clients/Actuator'

export const dataContext = createContext<DataContext>({
    clients: [],
    data: {}
})

interface ShowProps {
    input: string
}

const types = ['time-based grapher', 'instant grapher', 'actuator']

export default function ShowClients({ input }: ShowProps) {
    const [clients, setClients] = useState<Client[]>([])
    const [data, setData] = useState<Data>({})

    const config = configStore(state => ({ ...state }))
    const token = authStore(state => state.token)
    const { clients: clientsList, refetchClients } = dataStore(state => ({
        ...state
    }))

    useEffect(refetchClients, [])

    useEffect(() => {
        const clientNames = input.split(',').map(e => decodeURI(e).trim())

        const list = clientsList
            .filter(client => clientNames.includes(client.name))
            .sort((a, b) => types.indexOf(a.type) - types.indexOf(b.type))

        setClients(list)
    }, [input, clientsList])

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
                            return <Plot context={dataContext} key={index} client={client} />
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
