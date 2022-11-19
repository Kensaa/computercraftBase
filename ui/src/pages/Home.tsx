import React, { useEffect, useState, CSSProperties } from 'react'
import { Form, Container, Table, Alert, Button } from 'react-bootstrap'
import AppNavbar from '../components/AppNavbar'
import { useLocation } from 'wouter'

import authStore from '../stores/auth'
import configStore from '../stores/config'
 
interface Client {
    id: string
    clientType: string
    dataType:string
    connected:boolean
}

export default function Home() {
    const [, setLocation] = useLocation()
    const [searchValue, setSearchValue] = useState('');
    const [connectedClientFilter, setConnectedClientFilter] = useState(true)

    const config = configStore(state => ({...state}))
    const token = authStore(state => state.token)

    const [clients, setClients] = useState<Client[]>([])
    const [shownClients, setShownClients] = useState<Client[]>([])
    const [selectedClient, setSelectedClient] = useState<number[]>([])

    useEffect(() => {
        fetch(`${config.address}/api/client/all`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()).then(res => {
            const p = res.map((e:any) => ({...e, dataType: e.dataType.type}))
            setClients(p)
            //setShownClients(p)
        })
    },[config.address, token])
    
    useEffect(() => {
        setSelectedClient([])
        let before = clients
        if(connectedClientFilter) {
            before = before.filter((e:any) => e.connected)
        }
        if (searchValue.length === 0) {
            setShownClients(before)
        }else{
            const after = []
            for(const client of before){
                if(client.clientType.toLowerCase().includes(searchValue.toLowerCase())){
                    after.push(client)
                    continue
                }
                if(client.dataType.toLowerCase().includes(searchValue.toLowerCase())){
                    after.push(client)
                    continue
                }
                if(client.id.toLowerCase().includes(searchValue.toLowerCase())){
                    after.push(client)
                }
            }
            setShownClients(after)
        }
    }, [clients, searchValue, connectedClientFilter])
    
    const clientClicked = (index: number) => {
        if(selectedClient.includes(index)){
            setSelectedClient(selectedClient.filter((e) => e !== index))
         }else{
            if(selectedClient.length >= config.maxSlectedClient)return
            setSelectedClient([...selectedClient, index])
        }
    }

    const onPressed = () => {
        if(selectedClient.length === 0) return
        const paramString = selectedClient.map((e) => shownClients[e].id).join(',')
        const loc = shownClients[selectedClient[0]].clientType === 'time-based grapher' ? 'time' : (shownClients[selectedClient[0]].clientType === 'instant grapher' ? 'instant' : 'actuator')
        setLocation(`/client/${loc}/${paramString}`)
    }
    return (
        <div className='w-100 h-100 d-flex flex-column'>
            <AppNavbar />
            <Container fluid className='m-0 mt-3 p-0 h-100 w-100 d-flex flex-column align-items-center'>
                <div className='h-100 w-75 d-flex flex-column align-items-center'>
                    <Form.Control value={searchValue} onChange={e => setSearchValue(e.target.value)} className='' placeholder='Search for a client' />
                    <Form.Check type='checkbox' checked={connectedClientFilter} onChange={e => setConnectedClientFilter(e.target.checked)} label="Only show connected client"/>
                    <Table className="mt-2" bordered hover>
                        <thead>
                            <tr className="user-select-none">
                                <th>Name</th>
                                <th>Type</th>
                                <th>Data</th>
                                <th>Connected</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shownClients.map((client, i) => {
                                const style: CSSProperties = {background:'', color:'', pointerEvents:'auto'} 
                                let disabled = false
                                if(selectedClient.includes(i)){
                                    style.background = "rgba(0, 0, 0, 0.3)"
                                }else if(selectedClient.length > 0) {
                                    if(client.clientType !== shownClients[selectedClient[0]].clientType){
                                        style.background = "rgba(0, 0, 0, 0.05)"
                                        style.color = "rgba(0, 0, 0, 0.6)"
                                        disabled = true
                                        style.pointerEvents = "none"
                                    }
                                }

                                
                                return(
                                <tr style={style} className="user-select-none" key={i} onClick={() => {if(!disabled)clientClicked(i)}}>
                                    <td>{client.id}</td>
                                    <td>{client.dataType}</td>
                                    <td>{client.clientType === 'time-based grapher' ? 'Time-based' : (client.clientType === 'instant grapher' ? 'Instant' : 'Actuator')}</td>
                                    <td>{client.connected ? 'Yes' : 'No'}</td>
                                </tr>
                            )})}
                        </tbody>
                    </Table>
                    <Button disabled={selectedClient.length === 0} variant='outline-primary' onClick={onPressed}>Open</Button>
                </div>
            </Container>
        </div>
    )
}
