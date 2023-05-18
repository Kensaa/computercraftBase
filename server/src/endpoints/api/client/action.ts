import type { Request, Response } from '../../middlewares'
import { z } from 'zod'

const bodySchema = z.object({
    name: z.string(),
    action: z.string(),
    data: z.record(z.string(), z.any()).optional()
})
const querySchema = z.object({})

export default function handler(
    req: Request<z.infer<typeof querySchema>, z.infer<typeof bodySchema>>,
    res: Response
) {
    if (!req.instances) return res.status(500).send('missing instances data')
    if (!req.user) return res.status(500).send('missing user data')
    const { database, connectedClients } = req.instances

    const body = bodySchema.parse(req.body)

    const client = database.getClientByName(body.name)
    if (!client) return res.status(404).send('user not found')
    const actions = client.actions
    if (!actions) return res.status(404).send('no action found for this client')
    if (actions.length === 0)
        return res.status(404).send('no action found for this client')
    if (!actions.includes(body.action))
        return res.status(404).send('action not found')

    const clientSession = connectedClients.find(e => e.name === client.name)
    if (!clientSession) return res.status(404).send('client is not connected')

    clientSession.ws.send({
        action: body.action,
        data: body.data
    })
    res.sendStatus(200)
}
