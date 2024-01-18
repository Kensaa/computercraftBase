import type { Request, Response } from '../../middlewares'
import { z } from 'zod'
import { clientSchema, clientInfoSchema } from '../../../types'

const bodySchema = z.object({})
const querySchema = z.object({})
const responseSchema = z.array(clientSchema.merge(clientInfoSchema).extend({ connected: z.boolean() }))

export default function handler(req: Request<z.infer<typeof querySchema>, z.infer<typeof bodySchema>>, res: Response) {
    if (!req.instances) return res.status(500).send('missing instances data')
    if (!req.user) return res.status(500).send('missing user data')
    const { database, connectedClients } = req.instances

    const clients = database.getClients()
    const output = []
    for (const client of clients) {
        const connected = connectedClients.filter(e => e.name === client.name).length > 0
        output.push({
            ...client,
            connected
        })
    }
    res.status(200).json(responseSchema.parse(output))
}
