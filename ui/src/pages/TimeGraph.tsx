import React, { useEffect, useState } from 'react'
import AppNavbar from '../components/AppNavbar'
import { Container, Tabs, Tab, Form, Spinner } from 'react-bootstrap'
import { useInterval } from 'usehooks-ts'

import configStore from '../stores/config'
import authStore from '../stores/auth'
import Plot from '../components/Plot'
import { queryFetch } from '../utils'

import { Client } from '../types'

interface GraphProps {
  input: string
}

interface Data {
    identifier:string
    data: DataPoint[]
}

interface DataPoint {
    data: Record<string,any>
    time:string
}

export default function TimeGraph({ input }: GraphProps) {
    const config = configStore(state => ({ ...state }))
    const [ids, setIds] = useState<string[]>([])
    const [clients, setClients] = useState<Client[]>([])
    const [data, setData] = useState<Data[]>([])

    const token = authStore(state => state.token)
    
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

    useInterval(() => {
        if(clients.length === 0) return

        queryFetch(
            `${config.address}/api/client/fetch`,
            { method: 'GET', headers: { 'Authorization': `Bearer ${token}` }},
            { query: JSON.stringify(clients.map(e => e.id)) }
        )
        .then(res => {
            if(res.status === 200) return res.json()
            throw new Error('error while fetching data')
        }).then(data => setData(data))
    },1000)

    if(data.length === 0) return(
        <div className='w-100 h-100 d-flex flex-column justify-content-center align-items-center'>
            <Spinner animation="border" />
        </div>)
    return (
        <div className='w-100 h-100 d-flex flex-column'>
            <AppNavbar />
            <div className="w-100 h-100 d-flex flex-row flex-wrap justify-content-center">
                {data.map((data,i) => {
                    const client = clients.find(e => e.id === data.identifier)
                    if(!client) return ''
                    const keys = client.dataType.keys
                    return <Plot key={i} data={data.data} keys={keys} width='45%' height='50%' name={client.id}/>
                })}
            </div>
        </div>

    )
}