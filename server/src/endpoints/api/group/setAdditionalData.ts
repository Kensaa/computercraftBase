import type { Request, Response } from '../../middlewares'
import { z } from 'zod'

const bodySchema = z.object({
    groupName: z.string(),
    clientName: z.string(),
    additionalData: z.record(z.string(), z.any())
})
const querySchema = z.object({})

export default function handler(
    req: Request<z.infer<typeof querySchema>, z.infer<typeof bodySchema>>,
    res: Response
) {
    if (!req.instances) return res.status(500).send('missing instances data')
    if (!req.user) return res.status(500).send('missing user data')
    const { database } = req.instances

    const body = bodySchema.parse(req.body)

    if (!database.getClientByName(body.clientName))
        return res.status(404).send('client not found')
    if (!database.groupExists(body.groupName))
        return res.status(404).send('group not found')

    database.setClientAdditionalData(
        body.groupName,
        body.clientName,
        body.additionalData
    )
    res.sendStatus(200)
}
