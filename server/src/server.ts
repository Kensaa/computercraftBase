import * as ws from 'ws'
import { WebSocket } from 'ws'
import * as express from 'express'
import * as cors from 'cors'
import { ServerDatabase } from './serverDatabase'
import {
    createDataMiddleware,
    errorMiddleware,
    authMiddleware
} from './endpoints/middlewares'
import * as http from 'http'

import clientFetch from './endpoints/api/client/fetch'
import clientAll from './endpoints/api/client/all'
import clientAction from './endpoints/api/client/action'

import accountRegister from './endpoints/api/account/register'
import accountLogin from './endpoints/api/account/login'
import accountMe from './endpoints/api/account/me'

import groupAll from './endpoints/api/group/all'
import groupGet from './endpoints/api/group/get'
import groupCreate from './endpoints/api/group/create'
import groupRemove from './endpoints/api/group/remove'
import groupAddClient from './endpoints/api/group/addClient'
import groupRemoveClient from './endpoints/api/group/removeClient'
import groupSetOrders from './endpoints/api/group/setOrders'

import {
    dataPayloadSchema,
    registerPayloadSchema,
    wsMessageSchema
} from './types'
import { randomBytes, createHash } from 'crypto'
import * as dotenv from 'dotenv'
dotenv.config()

const WEB_SERVER_PORT = parseInt(process.env.WEB_SERVER_PORT || '3695')
const DATABASE_PATH = process.env.DATABASE_PATH || 'database.db'

;(async () => {
    const expressApp = express()
    expressApp.use(express.json())
    expressApp.use(cors())

    const httpServer = http.createServer(expressApp)
    const wsServer = new ws.Server({ server: httpServer })

    httpServer.listen(WEB_SERVER_PORT, () =>
        console.log(`server started on port ${WEB_SERVER_PORT}`)
    )

    const database = new ServerDatabase(DATABASE_PATH)
    const connectedClients: { name: string; ws: WebSocket }[] = []
    const authSecret = randomBytes(64).toString('hex')

    const username = 'admin'
    const password = 'admin'
    const hashedPassword = createHash('sha256').update(password).digest('hex')
    if (database.count('Accounts', {}) === 0) {
        database.createAccount(username, hashedPassword)
    } else if (database.exists('Accounts', { username: 'admin' })) {
        database.db
            .prepare('DELETE FROM Accounts WHERE username = ? AND password = ?')
            .run(username, hashedPassword)
    }

    wsServer.on('connection', ws => {
        ws.on('message', async data => {
            const message = wsMessageSchema.parse(JSON.parse(data.toString()))
            if (message.action === 'register') {
                const payload = registerPayloadSchema.parse(message.payload)
                //Check if client is already connected (it can be the websocket that didn't close properly)
                const clientSession = connectedClients.find(
                    e => e.name === payload.name
                )
                if (clientSession) {
                    clientSession.ws.close()
                    connectedClients.splice(
                        connectedClients.indexOf(clientSession),
                        1
                    )
                }
                database.createClient(
                    payload.name,
                    payload.hidden === undefined ? false : payload.hidden,
                    payload.clientType,
                    payload.dataType.type,
                    payload.dataType.unit,
                    payload.dataType.keys,
                    payload.dataType.actions
                )
                connectedClients.push({ name: payload.name, ws })
                console.log(
                    `client "${payload.name}" connected (type : ${payload.clientType})`
                )
            } else if (message.action === 'data') {
                const payload = dataPayloadSchema.parse(message.payload)
                const clientSession = connectedClients.find(e => e.ws === ws)
                if (!clientSession) return ws.close()
                database.addData(clientSession.name, payload.data)
            } else {
                ws.send('unsupported action')
            }
        })

        ws.on('close', async () => {
            const clientSession = connectedClients.find(e => e.ws === ws)
            if (!clientSession) return
            const client = database.getClientByName(clientSession.name)
            if (!client) return
            console.log(
                `unregistering client named "${client.name}" (${client.type})`
            )
            connectedClients.splice(connectedClients.indexOf(clientSession), 1)
        })
    })

    expressApp.use(
        createDataMiddleware({
            database,
            connectedClients,
            authSecret
        })
    )

    expressApp.post('/api/account/login', accountLogin)

    expressApp.use(authMiddleware)

    expressApp.get('/api/client/fetch', clientFetch)
    expressApp.get('/api/client/all', clientAll)
    expressApp.post('/api/client/action', clientAction)
    expressApp.post('/api/account/register', accountRegister)
    expressApp.get('/api/account/me', accountMe)

    expressApp.get('/api/group/all', groupAll)
    expressApp.get('/api/group/get', groupGet)
    expressApp.post('/api/group/create', groupCreate)
    expressApp.post('/api/group/remove', groupRemove)
    expressApp.post('/api/group/addClient', groupAddClient)
    expressApp.post('/api/group/removeClient', groupRemoveClient)
    expressApp.post('/api/group/setOrders', groupSetOrders)

    expressApp.use(errorMiddleware)
})()
