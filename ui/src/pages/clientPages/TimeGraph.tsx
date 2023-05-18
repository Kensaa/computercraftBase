import React, { useEffect, useState } from 'react'
import AppNavbar from '../../components/AppNavbar'
import { Container, Tabs, Tab, Form, Spinner } from 'react-bootstrap'
import { useInterval } from 'usehooks-ts'

import configStore from '../../stores/config'
import authStore from '../../stores/auth'
import Plot from '../../components/Plot'
import { queryFetch } from '../../utils'

import { Client } from '../../types'

interface GraphProps {
    input: string
}
interface Datapoint {
    data: Record<string, number>
    time: string
}
type Data = Record<string, Datapoint[]>

export default function TimeGraph({ input }: GraphProps) {
    const config = configStore(state => ({ ...state }))
    const [clients, setClients] = useState<Client[]>([])
    const [data, setData] = useState<Data>({})

    const token = authStore(state => state.token)

    useEffect(() => {
        const names = input.split(',').map(e => decodeURI(e).trim())
        console.log('names', names)
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

    if (Object.keys(data).length === 0)
        return (
            <div className='w-100 h-100 d-flex flex-column justify-content-center align-items-center'>
                <Spinner animation='border' />
            </div>
        )
    return (
        <div className='w-100 h-100 d-flex flex-column'>
            <AppNavbar />
            <div className='w-100 h-100 d-flex flex-row flex-wrap justify-content-center'>
                {/*data.map((data, i) => {
                    const client = clients.find(e => e.id === data.identifier)
                    if (!client) return ''
                    const keys = client.dataKeys
                    if(!keys) return
                    return (
                        <Plot
                            key={i}
                            data={data.data}
                            keys={keys}
                            width='45%'
                            height='50%'
                            name={client.id}
                        />
                    )
                })*/}
                {clients.map((client, index) => {
                    const clientData = data[client.name]
                    if (!client.dataKeys) return
                    return (
                        <Plot
                            key={index}
                            data={clientData}
                            keys={client.dataKeys}
                            width='45%'
                            height='50%'
                            name={client.name}
                        />
                    )
                })}
            </div>
        </div>
    )
}
