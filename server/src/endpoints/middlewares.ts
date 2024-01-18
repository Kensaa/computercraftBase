import { ServerDatabase } from '../serverDatabase'
import { WebSocket } from 'ws'

import * as express from 'express'
import { ZodError } from 'zod'
import * as jwt from 'jsonwebtoken'

export interface Instances {
    database: ServerDatabase
    connectedClients: { name: string; ws: WebSocket }[]
    authSecret: string
}

export interface Request<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Q extends Record<string, any> = Record<string, any>,
    B = Record<string, unknown>
> extends express.Request {
    query: Q
    body: B
    instances?: Instances
    user?: { id: number }
}

export type Response = express.Response

export function createDataMiddleware(instances: Instances) {
    return (req: Request, res: Response, next: express.NextFunction) => {
        req.instances = instances
        next()
    }
}
export function errorMiddleware(err: Error, req: Request, res: Response, next: express.NextFunction) {
    if (err instanceof ZodError) {
        res.status(400).json(err.errors)
    } else {
        res.status(500).json(err.stack)
    }
}

export function authMiddleware(req: Request, res: Response, next: express.NextFunction) {
    if (!req.instances) return res.status(500).send('missing instances data')
    const authHeader = req.headers.authorization
    if (authHeader) {
        jwt.verify(authHeader.split(' ')[1], req.instances.authSecret, (err, user) => {
            if (err) return res.sendStatus(403)
            req.user = user as { id: number }
            next()
        })
    } else {
        res.sendStatus(401)
    }
}
