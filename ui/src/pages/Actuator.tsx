import React, { useState, useEffect } from 'react'
import { ListGroup, Button } from 'react-bootstrap'

import configStore from '../stores/config'
import authStore from '../stores/auth'
import AppNavbar from '../components/AppNavbar'

interface ActuatorProps {
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
        actions?: string[]
    }
    connected: boolean
}

export default function Actuator({ input }: ActuatorProps) {
    const config = configStore(state => ({ ...state }))
    const token = authStore(state => state.token)
    const [ids, setIds] = useState<string[]>([])
    const [clients, setClients] = useState<Client[]>([])

    
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

    return (
        <div className='w-100 h-100 d-flex flex-column'>
            <AppNavbar />
            <div className="w-100 h-100 d-flex flex-row flex-wrap justify-content-center">
                {clients.map((client, clientI) => (
                    <Client key={clientI} client={client}/>
                ))}
            </div>
        </div>
    )
}

function Client({ client }: { client: Client }) {
    const [selected, setSelected] = useState<number>()
    const token = authStore(state => state.token)
    const config = configStore(state => ({ ...state }))

    const onSend = () => {
        if(selected === undefined) return
        setSelected(undefined)
        console.log('send', selected)
        if(!client.dataType.actions) return
        fetch(`${config.address}/api/client/action`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
                identifier: client.id,
                action: client.dataType.actions[selected]
            })
        })
    }

    return (
        <div className="mt-3 flex-grow">
           <ListGroup>
                {client.dataType.actions?.map((action, actionI) => (
                    <ListGroup.Item className="user-select-none" active={selected === actionI} onClick={() => setSelected(actionI)} key={actionI}>{action}</ListGroup.Item>
                ))}
            </ListGroup>
            <Button disabled={selected === undefined} className="mt-3" onClick={onSend}>Send</Button>
        </div>
    )
}