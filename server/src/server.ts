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

import clientFetch from './endpoints/api/client/fetch'
import clientAll from './endpoints/api/client/all'
import clientAction from './endpoints/api/client/action'
import clientAddToGroup from './endpoints/api/client/addToGroup'
import clientRemoveFromGroup from './endpoints/api/client/removeFromGroup'

import accountRegister from './endpoints/api/account/register'
import accountLogin from './endpoints/api/account/login'
import accountMe from './endpoints/api/account/me'

import groupAll from './endpoints/api/group/all'
import groupGet from './endpoints/api/group/get'
import groupCreate from './endpoints/api/group/create'
import groupRemove from './endpoints/api/group/remove'

const SOCKETPORT = 3694
const WEBSERVERPORT = SOCKETPORT + 1

;(async () => {
    const wsServer = new ws.Server({ port: SOCKETPORT })
    console.log(`websocket server started on port ${SOCKETPORT}`)
    const expressServer = express()
    expressServer.use(express.json())
    expressServer.use(cors())
    expressServer.listen(WEBSERVERPORT, () =>
        console.log(`web server started on port ${WEBSERVERPORT}`)
    )

    const database = new ServerDatabase('database.db')
    const connectedClients: { name: string; ws: WebSocket }[] = []
    const authSecret = 'feur'

    expressServer.use(
        createDataMiddleware({
            database,
            connectedClients,
            authSecret
        })
    )

    expressServer.get('/api/client/fetch', authMiddleware, clientFetch)
    expressServer.get('/api/client/all', authMiddleware, clientAll)
    expressServer.post('/api/client/action', authMiddleware, clientAction)
    expressServer.post(
        '/api/client/addToGroup',
        authMiddleware,
        clientAddToGroup
    )
    expressServer.post(
        '/api/client/removeFromGroup',
        authMiddleware,
        clientRemoveFromGroup
    )
    expressServer.post('/api/account/register', accountRegister)
    expressServer.post('/api/account/login', accountLogin)
    expressServer.get('/api/account/me', authMiddleware, accountMe)

    expressServer.get('/api/group/all', authMiddleware, groupAll)
    expressServer.get('/api/group/get', authMiddleware, groupGet)
    expressServer.post('/api/group/create', authMiddleware, groupCreate)
    expressServer.post('/api/group/remove', authMiddleware, groupRemove)

    expressServer.use(errorMiddleware)
})()
