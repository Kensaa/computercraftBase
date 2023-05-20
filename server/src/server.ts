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
import { randomBytes } from 'crypto'

const WEBSERVERPORT = 3695

;(async () => {
    const expressApp = express()
    expressApp.use(express.json())
    expressApp.use(cors())

    const httpServer = http.createServer(expressApp)
    const wsServer = new ws.Server({ server: httpServer })

    httpServer.listen(WEBSERVERPORT, () =>
        console.log(`server started on port ${WEBSERVERPORT}`)
    )

    const database = new ServerDatabase('database.db')
    const connectedClients: { name: string; ws: WebSocket }[] = []
    const authSecret = randomBytes(64).toString('hex')

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

    expressApp.get('/api/client/fetch', authMiddleware, clientFetch)
    expressApp.get('/api/client/all', authMiddleware, clientAll)
    expressApp.post('/api/client/action', authMiddleware, clientAction)
    expressApp.post('/api/account/register', accountRegister)
    expressApp.post('/api/account/login', accountLogin)
    expressApp.get('/api/account/me', authMiddleware, accountMe)

    expressApp.get('/api/group/all', authMiddleware, groupAll)
    expressApp.get('/api/group/get', authMiddleware, groupGet)
    expressApp.post('/api/group/create', authMiddleware, groupCreate)
    expressApp.post('/api/group/remove', authMiddleware, groupRemove)
    expressApp.post('/api/group/addClient', authMiddleware, groupAddClient)
    expressApp.post(
        '/api/group/removeClient',
        authMiddleware,
        groupRemoveClient
    )
    expressApp.post('/api/group/setOrders', authMiddleware, groupSetOrders)

    expressApp.use(errorMiddleware)
})()
