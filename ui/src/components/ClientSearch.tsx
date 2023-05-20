import React, { useEffect, useState } from 'react'
import { Form, Table, Button } from 'react-bootstrap'
import { useLocation } from 'wouter'

import authStore from '../stores/auth'
import configStore from '../stores/config'
import { Client } from '../types'

interface ClientSearchProps {
    onValidate: (selectedClients: Client[]) => void
}

export default function ClientSearch({ onValidate }: ClientSearchProps) {
    const [searchValue, setSearchValue] = useState('')
    const [onlyShowConnected, setOnlyShowConnected] = useState(true)
    const [showHidden, setShowHidden] = useState(false)

    const config = configStore(state => ({ ...state }))
    const token = authStore(state => state.token)

    const [clients, setClients] = useState<Client[]>([])
    const [shownClients, setShownClients] = useState<Client[]>([])
    const [selectedClients, setSelectedClients] = useState<number[]>([])

    useEffect(() => {
        fetch(`${config.address}/api/client/all`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(res => {
                setClients(res)
            })
    }, [config.address, token])

    useEffect(() => {
        setSelectedClients([])
        let before = clients
        if (onlyShowConnected) {
            before = before.filter(e => e.connected)
        }
        if (!showHidden) {
            before = before.filter(e => !e.hidden)
        }
        if (searchValue.length === 0) {
            setShownClients(before)
        } else {
            const after = []
            const searchKeys = ['type', 'dataType', 'name']
            for (const client of before) {
                const value = searchValue.toLowerCase()
                for (const key of searchKeys) {
                    // @ts-ignore
                    if (client[key].toLowerCase().includes(value)) {
                        after.push(client)

                        break
                    }
                }
            }
            setShownClients(after)
        }
    }, [clients, searchValue, onlyShowConnected, showHidden])

    const clientClicked = (index: number) => {
        if (selectedClients.includes(index)) {
            setSelectedClients(selectedClients.filter(e => e !== index))
        } else {
            if (selectedClients.length >= config.maxSelectedClient) return
            setSelectedClients([...selectedClients, index])
        }
    }

    const onBtnPressed = () => {
        if (selectedClients.length === 0) return
        onValidate(selectedClients.map(i => shownClients[i]))
        setSelectedClients([])
    }
    return (
        <div
            style={{ width: '45%' }}
            className='h-100 d-flex flex-column align-items-center'
        >
            <Form.Control
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                className=''
                placeholder='Search for a client'
            />
            <div>
                <Form.Check
                    type='checkbox'
                    checked={onlyShowConnected}
                    onChange={e => setOnlyShowConnected(e.target.checked)}
                    label='Only show connected client'
                />
                <Form.Check
                    type='checkbox'
                    checked={showHidden}
                    onChange={e => setShowHidden(e.target.checked)}
                    label='Show hidden client'
                />
            </div>
            <Table className='mt-2' bordered hover>
                <thead>
                    <tr className='user-select-none'>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Data</th>
                        <th>Connected</th>
                    </tr>
                </thead>
                <tbody>
                    {shownClients.map((client, index) => {
                        const selected = selectedClients.includes(index)
                        const disabled = false
                        return (
                            <ClientRow
                                client={client}
                                key={index}
                                onClick={() => clientClicked(index)}
                                selected={selected}
                                disabled={disabled}
                            />
                        )
                    })}
                </tbody>
            </Table>
            <Button
                disabled={selectedClients.length === 0}
                variant='outline-primary'
                onClick={onBtnPressed}
            >
                Select
            </Button>
        </div>
    )
}

interface ClientRowProps {
    client: Client
    selected?: boolean
    disabled?: boolean
    onClick: () => void
}
function ClientRow({
    client,
    selected = false,
    disabled = false,
    onClick
}: ClientRowProps) {
    const typeToString = (type: Client['type']) => {
        let typeString = ''
        switch (type) {
            case 'time-based grapher':
                typeString = 'Time-based'
                break
            case 'instant grapher':
                typeString = 'Instant'
                break
            case 'actuator':
                typeString = 'Actuator'
                break
            default:
                typeString = 'Unknown'
        }
        return typeString
    }
    return (
        <tr
            className={[
                'user-select-none',
                'tableRow',
                selected ? 'selected' : '',
                disabled ? 'disabled' : ''
            ]
                .filter(e => e !== '')
                .join(' ')}
            onClick={onClick}
        >
            <td>{client.name}</td>
            <td>{client.dataType}</td>
            <td>{typeToString(client.type)}</td>
            <td>{client.connected ? 'Yes' : 'No'}</td>
        </tr>
    )
}
