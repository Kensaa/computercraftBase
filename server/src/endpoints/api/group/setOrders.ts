import type { Request, Response } from '../../middlewares'
import { z } from 'zod'

const bodySchema = z.object({
    groupName: z.string(),
    orders: z.record(z.string(), z.number().positive())
})
const querySchema = z.object({})

export default function handler(req: Request<z.infer<typeof querySchema>, z.infer<typeof bodySchema>>, res: Response) {
    if (!req.instances) return res.status(500).send('missing instances data')
    if (!req.user) return res.status(500).send('missing user data')
    const { database } = req.instances

    const body = bodySchema.parse(req.body)

    if (!database.groupExists(body.groupName)) return res.status(404).send('group not found')

    for (const clientName of Object.keys(body.orders)) {
        if (!database.getClientByName(clientName)) return res.status(404).send(`client "${clientName}" not found`)
        const order = body.orders[clientName]
        const success = database.setClientOrder(clientName, body.groupName, order)
        if (!success) res.status(404).send(`client "${clientName}" is not in group`)
    }

    res.sendStatus(200)
}
