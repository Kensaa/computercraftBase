import type { Request, Response } from '../../middlewares'
import { z } from 'zod'

const bodySchema = z.object({
    name: z.string(),
    type: z.string()
})
const querySchema = z.object({})

export default function handler(req: Request<z.infer<typeof querySchema>, z.infer<typeof bodySchema>>, res: Response) {
    if (!req.instances) return res.status(500).send('missing instances data')
    if (!req.user) return res.status(500).send('missing user data')
    const { database } = req.instances

    const body = bodySchema.parse(req.body)
    const groupID = database.createGroup(body.name, body.type)

    if (!groupID) return res.status(409).send('group already exists')
    res.sendStatus(200)
}
