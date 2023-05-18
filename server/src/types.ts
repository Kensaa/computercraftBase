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
    name: z.string()
})
export type Group = z.infer<typeof groupSchema>
/////////////////////////////////////////////////////////////////////////////////
export const groupMemberSchema = z.object({
    groupName: groupSchema.shape.name,
    clientName: clientSchema.shape.name
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
