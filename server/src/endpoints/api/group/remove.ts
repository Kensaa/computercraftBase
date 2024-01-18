import type { Request, Response } from '../../middlewares'
import { z } from 'zod'

const bodySchema = z.object({
    name: z.string()
})
const querySchema = z.object({})

export default function handler(req: Request<z.infer<typeof querySchema>, z.infer<typeof bodySchema>>, res: Response) {
    if (!req.instances) return res.status(500).send('missing instances data')
    if (!req.user) return res.status(500).send('missing user data')
    const { database } = req.instances

    const body = bodySchema.parse(req.body)
    if (!database.groupExists(body.name)) return res.status(404).send('group not found')

    database.removeGroup(body.name)
    res.sendStatus(200)
}
