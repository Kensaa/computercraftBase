import type { Request, Response } from '../../middlewares'
import { z } from 'zod'
import { accountSchema } from '../../../types'
import * as jwt from 'jsonwebtoken'

const bodySchema = z.object({
    username: z.string(),
    password: z.string()
})
const querySchema = z.object({})
const responseSchema = z.object({
    user: accountSchema.omit({ password: true }),
    token: z.string()
})

export default function handler(
    req: Request<z.infer<typeof querySchema>, z.infer<typeof bodySchema>>,
    res: Response
) {
    if (!req.instances) return res.status(500).send('missing instances data')
    const { database, authSecret } = req.instances

    const body = bodySchema.parse(req.body)

    const id = database.createAccount(body.username, body.password)
    if (!id) return res.status(409).send('username already taken')

    const rawUser = database.getAccount(id)
    if (!rawUser) return res.status(500).send('that should not happen')
    const { password: _, ...user } = rawUser

    const output = { user, token: jwt.sign({ id: user.id }, authSecret) }
    res.status(200).json(responseSchema.parse(output))
}
