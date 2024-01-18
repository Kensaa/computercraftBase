export interface Client {
    name: string
    hidden: boolean
    connected: boolean
    type: 'time-based grapher' | 'instant grapher' | 'actuator'
    dataType: string
    dataUnit?: string
    dataKeys?: string[][]
    actions?: string[]
}

export type GroupMember = Client & {
    clientOrder: number
    additionalData: Record<string, any>
}

export interface Datapoint {
    data: Record<string, number>
    time: string
}

export type Data = Record<string, Datapoint[]>

export interface Group {
    name: string
    type: string
}

export interface DataContext {
    clients: Client[]
    data: Data
}

export const groupTypes = ['default', 'create']
