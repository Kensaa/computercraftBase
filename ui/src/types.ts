export interface Client {
    name: string
    hidden: boolean
    connected: boolean
    type: 'time-based grapher' | 'instant grapher' | 'actuator'
    dataType: string
    dataUnit?: string
    dataKeys?: string[]
    actions?: string[]
}
