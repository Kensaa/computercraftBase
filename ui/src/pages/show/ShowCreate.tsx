import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState
} from 'react'
import { queryFetch } from '../../utils'
import { Data, DataContext, GroupMember } from '../../types'
import configStore from '../../stores/config'
import authStore from '../../stores/auth'
import AppNavbar from '../../components/AppNavbar'
import {
    ReactFlow,
    Background,
    Node,
    Edge,
    applyNodeChanges,
    applyEdgeChanges,
    NodeChange,
    EdgeChange,
    Handle,
    Position
} from 'reactflow'
import 'reactflow/dist/style.css'
import '../../style/nodes.scss'
import { useInterval } from 'usehooks-ts'
import { Button, ProgressBar } from 'react-bootstrap'

interface ShowProps {
    input: string
}

const nodeTypes = { meter: MeterNode, switch: SwitchNode }

export const dataContext = createContext<DataContext>({
    clients: [],
    data: {}
})

export default function ShowCreate({ input }: ShowProps) {
    const [clients, setClients] = useState<GroupMember[]>([])
    const [data, setData] = useState<Data>({})

    const config = configStore(state => ({ ...state }))
    const token = authStore(state => state.token)

    useEffect(() => {
        const groupName = decodeURI(input).trim()
        queryFetch(
            `${config.address}/api/group/get`,
            {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` }
            },
            { name: groupName }
        )
            .then(res => {
                if (res.status === 200) return res.json()
                throw new Error('error while fetching clients infos')
            })
            .then(members => members as GroupMember[])
            .then(members =>
                members.sort((a, b) => a.clientOrder - b.clientOrder)
            )
            .then(members =>
                members.filter(e => e.dataType.toLowerCase().includes('create'))
            )
            .then(members => setClients(members))
    }, [input, config.address])

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

    useEffect(() => {
        setNodes(
            clients.map((client, index) => {
                if (client.dataType === 'create meter unit') {
                    return {
                        id: client.name,
                        type: 'meter',
                        data: { client },
                        position: { x: 300 * index, y: 0 }
                    }
                } else {
                    return {
                        id: client.name,
                        type: 'switch',
                        data: { client },
                        position: { x: 300 * index, y: 0 }
                    }
                }
            })
        )
    }, [clients])

    const [nodes, setNodes] = useState<Node[]>([])
    const [edges, setEdges] = useState<Edge[]>([])

    const onNodesChange = useCallback(
        (changes: NodeChange[]) =>
            setNodes(nds => applyNodeChanges(changes, nds)),
        []
    )
    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) =>
            setEdges(eds => applyEdgeChanges(changes, eds)),
        []
    )

    return (
        <dataContext.Provider value={{ clients, data }}>
            <div className='w-100 h-100 d-flex flex-column'>
                <AppNavbar />
                <div
                    className='w-100 h-100 d-flex flex-row flex-wrap justify-content-center'
                    style={{ padding: '0.5rem' }}
                >
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        nodeTypes={nodeTypes}
                    >
                        <Background />
                    </ReactFlow>
                </div>
            </div>
        </dataContext.Provider>
    )
}

interface NodeProps {
    data: {
        client: GroupMember
    }
    isConnectable: boolean
}

function MeterNode({ data: { client }, isConnectable }: NodeProps) {
    if (client.dataType !== 'create meter unit')
        return <div>INVALID CLIENT</div>
    const clientData = useContext(dataContext).data[client.name]

    if (!clientData || clientData.length === 0) return <div>LOADING</div>

    const { speed, capacity, stress } = clientData[0].data
    return (
        <div>
            <h3 style={{ borderBottom: '1px solid #dee2e6' }}>{client.name}</h3>
            <h4>Speed: {speed}RPM</h4>
            <h5>
                {stress}su / {capacity}su
            </h5>
            <ToggleSwitch client={client} />
            <ProgressBar
                now={stress}
                max={capacity}
                label={`${((stress * 100) / capacity).toFixed(1)}%`}
            />
            <Handle
                type='target'
                position={Position.Top}
                isConnectable={isConnectable}
            />
            <Handle
                type='source'
                position={Position.Bottom}
                isConnectable={isConnectable}
            />
        </div>
    )
}

function SwitchNode({ data: { client }, isConnectable }: NodeProps) {
    if (client.dataType !== 'create switch') return <div>INVALID CLIENT</div>
    return (
        <div>
            <h3 style={{ borderBottom: '1px solid #dee2e6' }}>{client.name}</h3>
            <ToggleSwitch client={client} />
            <Handle
                type='target'
                position={Position.Top}
                isConnectable={isConnectable}
            />
            <Handle
                type='source'
                position={Position.Bottom}
                isConnectable={isConnectable}
            />
        </div>
    )
}

interface ToggleSwitchProps {
    client: GroupMember
    defaultOn?: boolean
}

function ToggleSwitch({ client, defaultOn = true }: ToggleSwitchProps) {
    const [isOn, setIsOn] = useState(defaultOn)
    const config = configStore(state => ({ ...state }))
    const token = authStore(state => state.token)
    const action = (action: string) => {
        console.log(action === 'on')
        setIsOn(action === 'on')
        fetch(`${config.address}/api/client/action`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: client.name, action })
        })
    }

    return (
        <div className='d-flex justify-content-center mt-2'>
            <Button
                onClick={() => action('on')}
                variant={isOn ? 'success' : 'outline-success'}
                className='m-1'
            >
                ON
            </Button>
            <Button
                onClick={() => action('off')}
                variant={isOn ? 'outline-danger' : 'danger'}
                className='m-1'
            >
                OFF
            </Button>
        </div>
    )
}
