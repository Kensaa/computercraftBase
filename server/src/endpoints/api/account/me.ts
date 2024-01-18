import type { Request, Response } from '../../middlewares'
import { z } from 'zod'
import { accountSchema } from '../../../types'

const bodySchema = z.object({})
const querySchema = z.object({})
const responseSchema = accountSchema.omit({ password: true })

export default function handler(req: Request<z.infer<typeof querySchema>, z.infer<typeof bodySchema>>, res: Response) {
    if (!req.instances) return res.status(500).send('missing instances data')
    if (!req.user) return res.status(500).send('missing user data')
    const { database } = req.instances

    const rawUser = database.getAccount(req.user.id)
    if (!rawUser) return res.status(403).send('account not found')
    const { password: _, ...user } = rawUser
    res.status(200).json(responseSchema.parse(user))
}
