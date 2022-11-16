import React, { useEffect, useState } from 'react'
import AppNavbar from '../components/AppNavbar'
import { Container, Tabs, Tab, Form, Spinner } from 'react-bootstrap'
import { useInterval } from 'usehooks-ts'

import configStore from '../stores/config'
import authStore from '../stores/auth'
import Plot from '../components/visualisers/Plot'
import { throws } from 'assert'

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

        fetch(`${config.address}/api/client/get`,{
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ query: ids })
        }).then(res => {
            if(res.status === 200) return res.json()
            throw new Error('error while fetching clients infos')
        }).then(data => setClients(data))
    }, [ids])

    useInterval(() => {
        if(clients.length === 0) return
        fetch(`${config.address}/api/client/fetch`,{
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ query: clients.map(e => e.id) })
        }).then(res => {
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