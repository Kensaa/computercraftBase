import * as ws from 'ws'
import * as express from 'express'
import * as cors from 'cors'
import { Request, Response, NextFunction } from 'express'
import * as sql from './sql'
import * as jwt from 'jsonwebtoken'
import {
    WSMessage,
    RegisterPayload,
    Client,
    DataPayload,
    ActionMessage
} from './type'
import { randomBytes } from 'crypto'

const authTokenSecret = randomBytes(64).toString('hex')

const SOCKETPORT = 3694
const WEBSERVERPORT = SOCKETPORT + 1

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

function generateAuthToken(user: { id: number; username: string }) {
    return jwt.sign(user, authTokenSecret)
}

;(async () => {
    const wsServer = new ws.Server({ port: SOCKETPORT })
    console.log(`websocket server started on port ${SOCKETPORT}`)

    const expressServer = express()
    expressServer.use(express.json())
    expressServer.use(cors())
    expressServer.listen(WEBSERVERPORT, () =>
        console.log(`web server started on port ${WEBSERVERPORT}`)
    )

    const database = await sql.loadDatabase('database.db')

    wsServer.on('connection', ws => {
        ws.on('message', async data => {
            const message: WSMessage = JSON.parse(data.toString())

            if (message.action === 'register') {
                const payload: RegisterPayload = message.payload
                if (clients.find(client => client.id === payload.id)) {
                    return ws.close()
                }
                let hidden = false
                if (payload.hidden) hidden = payload.hidden

                clients.push({
                    ...payload,
                    websocket: ws,
                    dataType: JSON.stringify(payload.dataType),
                    connected: true,
                    hidden
                })

                // Update database with connected Client
                if (await sql.clientExists(database, payload.id)) {
                    // If client already exists, update it
                    sql.setClientConnected(database, payload.id, true)
                } else {
                    // If client doesn't exist, create it
                    sql.addClient(
                        database,
                        payload.id,
                        payload.clientType,
                        JSON.stringify(payload.dataType),
                        true,
                        hidden
                    )
                }

                console.log(
                    `client "${payload.id}" connected (type : ${payload.clientType})`
                )
            } else if (message.action === 'data') {
                const payload: DataPayload = message.payload
                const client = clients.find(client => client.websocket === ws)
                if (client) {
                    if (client.clientType === 'instant grapher') {
                        sql.setInstantData(
                            database,
                            client.id,
                            JSON.stringify(payload.data)
                        )
                    } else if (client.clientType === 'time-based grapher') {
                        sql.addTimeData(
                            database,
                            client.id,
                            new Date().toISOString(),
                            JSON.stringify(payload.data)
                        )
                    }
                }
            }
        })
        ws.on('close', async () => {
            const client = clients.find(c => c.websocket === ws)
            if (!client) return
            console.log(
                `unregistering client with identifier "${client.id}" and type "${client.clientType}"`
            )
            clients = clients.filter(c => c.websocket !== ws)
            sql.setClientConnected(database, client.id, false)
        })
    })

    expressServer.get(
        '/api/client/fetch',
        authenticateJWT,
        async (req: Request, res: Response) => {
            /*
        *   This endpoint is used to fetch data from the database
        query: {
            query: [
                '[identifier]',
            ],
            count: number
        }*/
            const { query: queryStr, count: countStr } = req.query

            if (!queryStr) return res.status(400).send('query not provided')
            if (typeof queryStr !== 'string')
                return res.status(400).send('query is not an array')
            const query: string[] = JSON.parse(queryStr)
            if (query.length === 0)
                return res.status(400).send('query is empty')

            let number = undefined

            if (countStr) {
                if (typeof countStr !== 'string')
                    return res.status(400).send('number is not a string')
                number = parseInt(countStr)
                if (isNaN(number))
                    return res.status(400).send('number is not a number')
            }

            const queryResponses = []
            for (const identifier of query) {
                const client = await sql.getClientWithIdentifier(
                    database,
                    identifier
                )
                if (!client) {
                    queryResponses.push({
                        identifier,
                        error: 'client not found'
                    })
                    continue
                }
                if (client.clientType === 'time-based grapher') {
                    const data = (
                        await sql.getTimeData(database, identifier, number)
                    ).map(data => ({
                        time: data.time,
                        data: JSON.parse(data.data)
                    }))
                    data.reverse()
                    queryResponses.push({ identifier, data })
                } else if (client.clientType === 'instant grapher') {
                    const data = await sql.getInstantData(database, identifier)
                    queryResponses.push({
                        identifier,
                        data: JSON.parse(data.data)
                    })
                } else {
                    queryResponses.push({
                        identifier,
                        error: 'client type not supported'
                    })
                }
            }
            res.status(200).json(queryResponses)
        }
    )

    expressServer.get(
        '/api/client/all',
        authenticateJWT,
        async (req: Request, res: Response) => {
            /*
             *   This endpoint is used to fetch all clients
             */
            const clients = await sql.getClients(database)
            const preparedData = clients.map(client => ({
                id: client.id,
                clientType: client.clientType,
                dataType: JSON.parse(client.dataType),
                connected: client.connected,
                hidden: client.hidden
            }))
            res.status(200).json(preparedData)
        }
    )

    expressServer.get(
        '/api/client/get',
        authenticateJWT,
        async (req: Request, res: Response) => {
            /*
        *   This endpoint is used to fetch one or multiple clients
        query: {
            query: [
                identifier: [identifier of the client]
            ]
        }*/
            const { query: queryStr } = req.query

            if (!queryStr) return res.status(400).send('query not provided')
            if (typeof queryStr !== 'string')
                return res.status(400).send('query is not an array')
            const query: string[] = JSON.parse(queryStr)
            if (query.length === 0)
                return res.status(400).send('query is empty')

            const clients = await sql.getClients(database)
            const filteredClients = clients.filter(client =>
                query.includes(client.id)
            )
            const preparedData = filteredClients.map(client => ({
                id: client.id,
                clientType: client.clientType,
                dataType: JSON.parse(client.dataType),
                connected: client.connected,
                hidden: client.hidden
            }))

            res.status(200).json(preparedData)
        }
    )

    expressServer.post(
        '/api/client/action',
        authenticateJWT,
        async (req: Request, res: Response) => {
            /*
        *   This endpoint is used to send an action to a client
        body: {
            identifier: [identifier],
            action: [action],
            data: [data]
        }*/
            const { identifier, action, data } = req.body

            if (!identifier)
                return res.status(400).send('identifier not provided')
            if (!action) return res.status(400).send('action not provided')

            const client = await sql.getClientWithIdentifier(
                database,
                identifier
            )
            if (!client) return res.status(404).send('client not found')

            const possibleActions = JSON.parse(client.dataType).actions

            if (!possibleActions)
                return res.status(400).send('client has no action defined')
            if (possibleActions.length === 0)
                return res.status(400).send('client has no action defined')

            if (!possibleActions.includes(action))
                return res.status(400).send('action not supported')

            const ws = clients.find(c => c.id === identifier)?.websocket
            if (!ws) return res.status(404).send('client not connected')

            const message: ActionMessage = {
                action,
                data
            }
            ws.send(JSON.stringify(message))
            res.status(200).send('action sent')
        }
    )

    expressServer.post(
        '/api/user/register',
        async (req: Request, res: Response) => {
            /*
        *   This endpoint is used to register a user
        body: {
            username: [username],
            password: [hashed password]
        }*/
            const { username, password } = req.body

            if (!username) return res.status(400).send('username not provided')
            if (!password) return res.status(400).send('password not provided')

            if (await sql.userExists(database, username))
                return res.status(409).send('username already taken')

            await sql.addUser(database, username, password)

            const user = await sql.getUserByName(database, username)
            if (!user || !user.id)
                return res.status(500).send('something went wrong')
            const token = generateAuthToken({
                id: user.id,
                username: user.username
            })

            res.status(200).json({
                token,
                user: {
                    id: user.id,
                    username: user.username
                }
            })
        }
    )

    expressServer.post(
        '/api/user/login',
        async (req: Request, res: Response) => {
            /*
        *   This endpoint is used to login a user
        body: {
            username: [username],
            password: [hashed password]
        }*/
            const { username, password } = req.body

            if (!username) return res.status(400).send('username not provided')
            if (!password) return res.status(400).send('password not provided')

            const user = await sql.getUserByName(database, username)
            if (!user) return res.status(404).send('user not found')
            if (user.password !== password)
                return res.status(401).send('wrong password')

            if (!user.id) return res.status(500).send('something went wrong')

            const token = generateAuthToken({
                id: user.id,
                username: user.username
            })

            res.status(200).json({
                token,
                user: {
                    id: user.id,
                    username: user.username
                }
            })
        }
    )

    expressServer.get(
        '/api/user/me',
        authenticateJWT,
        async (req: Request, res: Response) => {
            /*
             *   This endpoint is used to get the user info
             */
            const user = await sql.getUserByName(database, res.locals.user.name)
            if (!user) return res.status(404).send('user not found')
            res.status(200).json({
                id: user.id,
                username: user.username
            })
        }
    )

    expressServer.get(
        '/api/group/all',
        authenticateJWT,
        async (req: Request, res: Response) => {
            /*
             *   This endpoint is used to get all groups
             */
            const groups = await sql.getGroups(database)
            if (!groups) return res.status(404).send('groups not found')
            const preparedData = groups.map(group => ({
                id: group.id,
                members: JSON.parse(group.members)
            }))
            res.status(200).json(preparedData)
        }
    )

    expressServer.get(
        '/api/group/get',
        authenticateJWT,
        async (req: Request, res: Response) => {
            /*
        *   This endpoint is used to get one or multiple groups
        query: {
            query: [
                identifier: [identifier of the group]
            ]
        }*/
            const { query: queryStr } = req.query

            if (!queryStr) return res.status(400).send('query not provided')
            if (typeof queryStr !== 'string')
                return res.status(400).send('query is not an array')
            const query: string[] = JSON.parse(queryStr)
            if (query.length === 0)
                return res.status(400).send('query is empty')

            const groups = await sql.getGroups(database)
            if (!groups) return res.status(404).send('groups not found')

            const filteredGroups = groups.filter(group =>
                query.includes(group.id)
            )
            const preparedData = filteredGroups.map(group => ({
                id: group.id,
                members: JSON.parse(group.members)
            }))

            res.status(200).json(preparedData)
        }
    )

    expressServer.post(
        '/api/group/create',
        authenticateJWT,
        async (req: Request, res: Response) => {
            /*
        *   This endpoint is used to create a group
        body: {
            id: [identifier of the group],
            members: [
                identifier: [identifier of the client]
            ]
        }*/
            const { id, members } = req.body

            if (!id) return res.status(400).send('id not provided')
            if (!members) return res.status(400).send('members not provided')
            if (members.length === 0)
                return res.status(400).send('members is empty')

            const clients = await sql.getClients(database)
            if (!clients) return res.status(404).send('clients not found')

            const filteredClients = clients.filter(client =>
                members.includes(client.id)
            )
            if (filteredClients.length !== members.length)
                return res.status(404).send('some clients not found')

            await sql.addGroup(database, id, JSON.stringify(members))

            res.status(200).send('group created')
        }
    )
})()
