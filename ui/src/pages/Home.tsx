import React, { useEffect, useState, CSSProperties } from 'react'
import { Form, Container, Table, Alert, Button } from 'react-bootstrap'
import AppNavbar from '../components/AppNavbar'
import { useLocation } from 'wouter'

import authStore from '../stores/auth'
import configStore from '../stores/config'
import { Client } from '../types'

export default function Home() {
    const [, setLocation] = useLocation()
    const [searchValue, setSearchValue] = useState('')
    const [onlyShowConnected, setOnlyShowConnected] = useState(true)
    const [showHidden, setShowHidden] = useState(false)

    const config = configStore(state => ({ ...state }))
    const token = authStore(state => state.token)

    const [clients, setClients] = useState<Client[]>([])
    const [shownClients, setShownClients] = useState<Client[]>([])
    const [selectedClient, setSelectedClient] = useState<number[]>([])

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
        setSelectedClient([])
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
            for (const client of before) {
                if (
                    client.type
                        .toLowerCase()
                        .includes(searchValue.toLowerCase())
                ) {
                    after.push(client)
                    continue
                }
                if (
                    client.dataType
                        .toLowerCase()
                        .includes(searchValue.toLowerCase())
                ) {
                    after.push(client)
                    continue
                }
                if (
                    client.name
                        .toLowerCase()
                        .includes(searchValue.toLowerCase())
                ) {
                    after.push(client)
                }
            }
            setShownClients(after)
        }
    }, [clients, searchValue, onlyShowConnected, showHidden])

    const clientClicked = (index: number) => {
        if (selectedClient.includes(index)) {
            setSelectedClient(selectedClient.filter(e => e !== index))
        } else {
            if (selectedClient.length >= config.maxSlectedClient) return
            setSelectedClient([...selectedClient, index])
        }
    }

    const onBtnPressed = () => {
        if (selectedClient.length === 0) return
        const paramString = selectedClient
            .map(e => shownClients[e].name)
            .join(',')
        let location = ''
        switch (shownClients[selectedClient[0]].type) {
            case 'time-based grapher':
                location = 'time'
                break
            case 'instant grapher':
                location = 'instant'
                break
            case 'actuator':
                location = 'actuator'
        }

        setLocation(`/client/${location}/${paramString}`)
    }
    return (
        <div className='w-100 h-100 d-flex flex-column'>
            <AppNavbar />
            <Container
                fluid
                className='m-0 mt-3 p-0 h-100 w-100 d-flex flex-column align-items-center'
            >
                <div className='h-100 w-75 d-flex flex-column align-items-center'>
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
                            onChange={e =>
                                setOnlyShowConnected(e.target.checked)
                            }
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
                                let selected = selectedClient.includes(index)
                                let disabled =
                                    selectedClient.length > 0 &&
                                    client.type !==
                                        shownClients[selectedClient[0]].type
                                return (
                                    <TableRow
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
                        disabled={selectedClient.length === 0}
                        variant='outline-primary'
                        onClick={onBtnPressed}
                    >
                        Open
                    </Button>
                </div>
            </Container>
        </div>
    )
}

interface TableRowProps {
    client: Client
    selected?: boolean
    disabled?: boolean
    onClick: () => void
}
function TableRow({
    client,
    selected = false,
    disabled = false,
    onClick
}: TableRowProps) {
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
