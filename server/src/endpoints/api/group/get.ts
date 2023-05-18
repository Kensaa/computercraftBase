import type { Request, Response } from '../../middlewares'
import { z } from 'zod'
import { clientSchema, clientInfoSchema } from '../../../types'

const bodySchema = z.object({
    name: z.string()
})
const querySchema = z.object({})
const responseSchema = z.array(clientSchema.merge(clientInfoSchema))

export default function handler(
    req: Request<z.infer<typeof querySchema>, z.infer<typeof bodySchema>>,
    res: Response
) {
    if (!req.instances) return res.status(500).send('missing instances data')
    if (!req.user) return res.status(500).send('missing user data')
    const { database } = req.instances

    const body = bodySchema.parse(req.body)

    const groups = database.getGroupMembers(body.name)
    if (!groups) return res.status(404).send('group not found')
    res.status(200).json(responseSchema.parse(groups))
}
