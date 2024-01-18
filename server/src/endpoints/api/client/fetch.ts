import type { Request, Response } from '../../middlewares'
import { z } from 'zod'

const bodySchema = z.object({})
const querySchema = z.object({
    query: z
        .array(
            z.string({
                invalid_type_error: 'query array must be strings'
            })
        )
        .nonempty('query is empty'),
    count: z.coerce.number().positive()
})
const responseSchema = z.record(
    z.string(),
    z.array(
        z.object({
            data: z.record(z.string(), z.any()),
            time: z.string().datetime()
        })
    )
)

export default function handler(req: Request<z.infer<typeof querySchema>, z.infer<typeof bodySchema>>, res: Response) {
    if (!req.instances) return res.status(500).send('missing instances data')
    if (!req.user) return res.status(500).send('missing user data')

    const { database } = req.instances

    const query = querySchema.parse(req.query)

    const output: Record<string, unknown> = {}
    for (const client of query.query) {
        output[client] = database.getDataFromClient(client, query.count)
    }

    res.status(200).json(responseSchema.parse(output))
}
