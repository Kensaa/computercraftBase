import * as ws from 'ws'
import * as express from 'express'
import * as cors from 'cors'
import { Request, Response, NextFunction } from 'express'
import * as sql from './sql'
import * as jwt from 'jsonwebtoken'
import { WSMessage, RegisterPayload, Client, DataPayload } from './type'
import {randomBytes} from 'crypto'

const authTokenSecret = randomBytes(64).toString('hex')

const SOCKETPORT = 3694
const WEBSERVERPORT = SOCKETPORT+1

let clients: Client[] = []

function authenticateJWT(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization
    if (authHeader) {
        jwt.verify(authHeader.split(' ')[1], authTokenSecret, (err, user) => {
            if (err) return res.sendStatus(403)
            res.locals.user = user
            next()
        })
    } else {
        res.sendStatus(401)
    }
}

function generateAuthToken(user: {id: number, username: string}) {
    return jwt.sign(user, authTokenSecret)
}


(async ()=>{
    const wsServer = new ws.Server({ port: SOCKETPORT })
    console.log(`websocket server started on port ${SOCKETPORT}`)

    const expressServer = express()
    expressServer.use(express.json())
    expressServer.use(cors())
    expressServer.listen(WEBSERVERPORT, () => console.log(`web server started on port ${WEBSERVERPORT}`))

    const database = await sql.loadDatabase('database.db')

    wsServer.on('connection', ws => {
        ws.on('message',async data => {
            const message: WSMessage = JSON.parse(data.toString())
            
            if(message.action === 'register'){
                const payload: RegisterPayload = message.payload
                if(clients.find(client => client.id === payload.id)){
                    ws.close()
                }else{
                    clients.push({...payload, websocket: ws, dataType: JSON.stringify(payload.dataType), connected: true})
                    if(await sql.clientExists(database, payload.id)){
                        sql.setClientConnected(database, payload.id, true)
                    }else{
                        sql.addClient(database, payload.id, payload.clientType, JSON.stringify(payload.dataType), true)
                    }
                    console.log(`client "${payload.id}" connected (type : ${payload.clientType})`)
                }
            }else if(message.action === 'data'){
                const payload: DataPayload = message.payload
                const client = clients.find(client => client.websocket === ws)
                if(client){
                    if(client.clientType === 'instant grapher') {
                        sql.setInstantData(database, client.id, JSON.stringify(payload.data))
                    }else if(client.clientType === 'time-based grapher'){
                        sql.addTimeData(database, client.id, new Date().toISOString(), JSON.stringify(payload.data))
                    }
                }
            }
        })
        ws.on('close',async ()=>{
            const client = clients.find(c=>c.websocket===ws)
            if(!client)return
            console.log(`unregistering client with identifier "${client.id}" and type "${client.clientType}"`)
            clients = clients.filter(c=>c.websocket!==ws)
            sql.setClientConnected(database, client.id, false)
        })
    })

    expressServer.post('/api/client/fetch', authenticateJWT, async (req: Request, res: Response) => {
        /*
        *   This endpoint is used to fetch data from the database
        body: {
            query: [
                '[identifier]',
            ],
            count: number
        }*/
        const { query, number } = req.body

        if(!query) return res.status(400).send('query not provided')
        if(query.length === 0) return res.status(400).send('query is empty')

        const queryResponses = []
        for(const identifier of query){
            const client = await sql.getClientWithIdentifier(database, identifier)
            if(!client){
                queryResponses.push({identifier, error: 'client not found'})
                continue
            }
            if(client.clientType === 'time-based grapher'){
                const data = (await sql.getTimeData(database, identifier, number)).map(data => ({time: data.time, data: JSON.parse(data.data)}))
                data.reverse()
                queryResponses.push({identifier, data})
            }else if(client.clientType === 'instant grapher'){
                const data = await sql.getInstantData(database, identifier)
                queryResponses.push({identifier, data: JSON.parse(data.data)})
            }else {
                queryResponses.push({identifier, error: 'client type not supported'})
            }
        }
        res.status(200).json(queryResponses)
    })

    expressServer.get('/api/client/all', authenticateJWT, async (req: Request, res: Response) => {
        /*
        *   This endpoint is used to fetch all clients
        */
        const clients = await sql.getClients(database)
        const preparedClients = clients.map(client => ({id: client.id, clientType: client.clientType, dataType: JSON.parse(client.dataType), connected: client.connected}))
        res.status(200).json(preparedClients)
    })

    expressServer.post('/api/client/list', authenticateJWT, async (req: Request, res: Response) => {
        /*
        *   This endpoint is used to list the data available in the database
        body: {
            dataType?: [data type passed by the client when it registered itself]
            clientType?: [client type passed by the client when it registered itself]
        }*/
        const { dataType, clientType } = req.body
            
        if(dataType && clientType) return res.status(400).send('cannot specify both dataType and clientType')
        if(!(dataType || clientType)) return res.status(400).send('must specify either dataType or clientType')

        if(dataType){
            // Fetch all clients
            const clients = await sql.getClients(database)
            
            // Filter clients based on dataType
            const filteredClients = clients.filter(client => JSON.parse(client.dataType).type === dataType)
            if(filteredClients.length === 0){
                return res.status(404).send('no client found')
            }
            const preparedData = filteredClients.map(client => (
                {
                    id: client.id,
                    clientType: client.clientType,
                    dataType: JSON.parse(client.dataType),
                    connected: client.connected
                }
            ))
            res.status(200).json(preparedData)
        }
        if(clientType){
            // Fetch all clients
            const clients = await sql.getClients(database)
            
            // Filter clients based on clientType
            const filteredClients = clients.filter(client => client.clientType === clientType)
            if(filteredClients.length === 0){
                return res.status(404).send('no client found')
            }
            const preparedData = filteredClients.map(client => (
                {
                    id: client.id,
                    clientType: client.clientType,
                    dataType: JSON.parse(client.dataType)
                }
            ))
            res.status(200).json(preparedData)
        }
    })

    expressServer.post('/api/client/get', authenticateJWT, async (req: Request, res: Response) => {
        /*
        *   This endpoint is used to fetch one or multiple clients
        body: {
            query: [
                identifier: [identifier of the client]
            ]
        }*/
        const { query } = req.body

        if(!query) return res.status(400).send('query not provided')
        if(query.length === 0) return res.status(400).send('query is empty')
        
        const clients = await sql.getClients(database)
        const filteredClients = clients.filter(client => query.includes(client.id))
        const preparedData = filteredClients.map(client => ({...client, dataType: JSON.parse(client.dataType)}))

        res.status(200).json(preparedData)
    })

    expressServer.post('/api/client/action', authenticateJWT, async (req: Request, res: Response) => {
        /*
        *   This endpoint is used to send an action to a client
        body: {
            identifier: [identifier],
            action: [action]
        }*/
        const { identifier, action } = req.body

        if(!identifier) return res.status(400).send('identifier not provided')
        if(!action) return res.status(400).send('action not provided')

        const client = await sql.getClientWithIdentifier(database, identifier)
        if(!client) return res.status(404).send('client not found')
        if(client.clientType !== 'actuator') return res.status(400).send('client type not supported')
        
        const possibleActions = JSON.parse(client.dataType).actions

        // If an actuator is registered with no actions, shouldnt happen but just in case...
        if(!possibleActions) return res.status(400).send('client is probably the impostor (should be ejected)')

        if(!possibleActions.includes(action)) return res.status(400).send('action not supported')

        const ws = clients.find(c=>c.id===identifier)?.websocket
        if(!ws) return res.status(404).send('client not connected')

        ws.send(action)
        res.status(200).send('action sent')
    })

    expressServer.post('/api/user/register', async (req: Request, res: Response) => {
        /*
        *   This endpoint is used to register a user
        body: {
            username: [username],
            password: [hashed password]
        }*/
        const { username, password } = req.body

        if(!username) return res.status(400).send('username not provided')
        if(!password) return res.status(400).send('password not provided')

        if(await sql.userExists(database, username)) return res.status(409).send('username already taken')

        await sql.addUser(database, username, password)

        const user = await sql.getUserByName(database, username)
        if(!user || !user.id) return res.status(500).send('something went wrong')
        const token = generateAuthToken({id: user.id, username: user.username})

        res.status(200).json({
            token,
            user: {
                id: user.id,
                username: user.username
            }
        })
    })

    expressServer.post('/api/user/login', async (req: Request, res: Response) => {
        /*
        *   This endpoint is used to login a user
        body: {
            username: [username],
            password: [hashed password]
        }*/
        const { username, password } = req.body

        if(!username) return res.status(400).send('username not provided')
        if(!password) return res.status(400).send('password not provided')

        const user = await sql.getUserByName(database, username)
        if(!user) return res.status(404).send('user not found')
        if(user.password !== password) return res.status(401).send('wrong password')

        if(!user.id) return res.status(500).send('something went wrong')

        const token = generateAuthToken({id: user.id, username: user.username})

        res.status(200).json({
            token,
            user: {
                id: user.id,
                username: user.username
            }
        })
    })

    expressServer.get('/api/user/me', authenticateJWT, async (req: Request, res: Response) => {
        /*
        *   This endpoint is used to get the user info
        */
        const user = await sql.getUserByName(database, res.locals.user.name)
        if(!user) return res.status(404).send('user not found')
        res.status(200).json({
            id: user.id,
            username: user.username
        })
    })
})()