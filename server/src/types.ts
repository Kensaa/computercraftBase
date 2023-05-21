import { z } from 'zod'

export const clientSchema = z.object({
    name: z.string(),
    hidden: z.coerce.boolean()
})
export type Client = z.infer<typeof clientSchema>
/////////////////////////////////////////////////////////////////////////////////
export const clientTypeSchema = z.enum([
    'time-based grapher',
    'instant grapher',
    'actuator'
])
export type ClientType = z.infer<typeof clientTypeSchema>
/////////////////////////////////////////////////////////////////////////////////
export const clientInfoSchema = z.object({
    type: clientTypeSchema,
    dataType: z.string(),
    dataUnit: z.string().nullable(),
    dataKeys: z.string().array().nullable(),
    actions: z.string().array().nullable()
})
export type ClientInfo = z.infer<typeof clientInfoSchema>
/////////////////////////////////////////////////////////////////////////////////
export const groupSchema = z.object({
    name: z.string(),
    type: z.string()
})
export type Group = z.infer<typeof groupSchema>
/////////////////////////////////////////////////////////////////////////////////
export const groupMemberSchema = z.object({
    clientOrder: z.number().positive(),
    additionalData: z.record(z.string(), z.any())
})
export type GroupMember = z.infer<typeof groupMemberSchema>
/////////////////////////////////////////////////////////////////////////////////
export const dataSchema = z.object({
    data: z.record(z.string(), z.any()),
    time: z.string().datetime()
})
export type Data = z.infer<typeof dataSchema>
/////////////////////////////////////////////////////////////////////////////////
export const accountSchema = z.object({
    id: z.number(),
    username: z.string(),
    password: z.string()
})
export type Account = z.infer<typeof accountSchema>
/////////////////////////////////////////////////////////////////////////////////
export const registerPayloadSchema = z.object({
    name: z.string(),
    clientType: clientTypeSchema,
    dataType: z.object({
        type: z.string(),
        unit: z.string().optional(),
        keys: z.string().array().optional(),
        actions: z.string().array().optional()
    }),
    hidden: z.boolean().optional()
})
export type RegisterPayload = z.infer<typeof registerPayloadSchema>
/////////////////////////////////////////////////////////////////////////////////
export const dataPayloadSchema = z.object({
    data: z.record(z.string(), z.unknown())
})
export type DataPayload = z.infer<typeof dataPayloadSchema>
/////////////////////////////////////////////////////////////////////////////////
export const webSocketActionSchema = z.enum(['register', 'data'])
export type webSocketAction = z.infer<typeof webSocketActionSchema>
/////////////////////////////////////////////////////////////////////////////////
export const wsMessageSchema = z.object({
    action: webSocketActionSchema,
    payload: registerPayloadSchema.or(dataPayloadSchema)
})
export type WSMessage = z.infer<typeof wsMessageSchema>
/////////////////////////////////////////////////////////////////////////////////
