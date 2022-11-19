export interface Client {
    dbid: number
    id: string
    clientType: string
    dataType: {
        type: string
        unit: string
        keys: string[]
        actions?: string[]
    }
    connected: boolean
}