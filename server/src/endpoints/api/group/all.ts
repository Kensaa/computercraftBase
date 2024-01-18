import type { Request, Response } from '../../middlewares'
import { z } from 'zod'
import { groupSchema } from '../../../types'

const bodySchema = z.object({})
const querySchema = z.object({})
const responseSchema = z.array(groupSchema)

export default function handler(req: Request<z.infer<typeof querySchema>, z.infer<typeof bodySchema>>, res: Response) {
    if (!req.instances) return res.status(500).send('missing instances data')
    if (!req.user) return res.status(500).send('missing user data')
    const { database } = req.instances

    const groups = database.getGroups()
    res.status(200).json(responseSchema.parse(groups))
}
