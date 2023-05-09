import React, {useState} from 'react'
import { Button, ListGroup } from 'react-bootstrap'

import authStore from '../stores/auth'
import configStore from '../stores/config'
import { Client } from '../types'

interface ActuatorProps {
    client: Client
    width: string
    height: string
}

export default function Actuator({ client, width, height }: ActuatorProps) {
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
        <div style={{width,height}} className="m-3 d-flex flex-column justify-content-center align-items-center border">
            <h3 style={{justifySelf:'flex-start'}}>{client.id}</h3>
            <ListGroup>
                {client.dataType.actions?.map((action, actionI) => (
                    <ListGroup.Item className="user-select-none" active={selected === actionI} onClick={() => setSelected(actionI)} key={actionI}>{action}</ListGroup.Item>
                ))}
            </ListGroup>
            <Button disabled={selected === undefined} className="mt-3" onClick={onSend}>Send</Button>
        </div>
    )
}