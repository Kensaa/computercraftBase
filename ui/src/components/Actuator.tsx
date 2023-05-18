import React, { useState } from 'react'
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
        if (selected === undefined) return
        setSelected(undefined)
        if (!client.actions) return
        fetch(`${config.address}/api/client/action`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                name: client.name,
                action: client.actions[selected]
            })
        })
    }

    return (
        <div
            style={{ maxWidth: width, maxHeight: height, padding: '0.5rem' }}
            className='m-3 d-flex flex-column align-items-center border'
        >
            <h3>{client.name}</h3>
            <div
                className='overflow-auto'
                style={{ maxHeight: '70%', flexGrow: 1 }}
            >
                <ListGroup className=''>
                    {client.actions?.map((action, actionI) => (
                        <ListGroup.Item
                            className='user-select-none'
                            active={selected === actionI}
                            onClick={() => setSelected(actionI)}
                            key={actionI}
                        >
                            {action}
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </div>
            <Button
                disabled={selected === undefined}
                style={{ marginTop: '0.5rem' }}
                onClick={onSend}
            >
                Send
            </Button>
        </div>
    )
}
