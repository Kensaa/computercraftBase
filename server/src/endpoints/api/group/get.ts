import type { Request, Response } from '../../middlewares'
import { z } from 'zod'
import {
    clientSchema,
    clientInfoSchema,
    groupMemberSchema
} from '../../../types'

const bodySchema = z.object({})
const querySchema = z.object({
    name: z.string()
})
const responseSchema = z.array(
    clientSchema.merge(clientInfoSchema).merge(groupMemberSchema)
)

export default function handler(
    req: Request<z.infer<typeof querySchema>, z.infer<typeof bodySchema>>,
    res: Response
) {
    if (!req.instances) return res.status(500).send('missing instances data')
    if (!req.user) return res.status(500).send('missing user data')
    const { database } = req.instances

    const query = querySchema.parse(req.query)

    const groups = database.getGroupMembers(query.name)
    if (!groups) return res.status(404).send('group not found')
    res.status(200).json(responseSchema.parse(groups))
}
