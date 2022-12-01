import { WebSocket } from 'ws'

export interface Client {
    dbid?: number // The id of the row in the Clients table
    id: string, //  An unique string set by the client to identify itself
    clientType: ClientType, // The type of the client
    websocket?: WebSocket, // The websocket object of the client (cannot be fetched from the database)
    dataType: string  /* DataType is stringified JSON of the form :
    {
        "type":"energyStorage"
        "unit":"FE"
        "keys":["maxStorage","currentStorage"]
    }
    used to further specify the type of data the client sends and to allow ui to fetch it according to the type of the data
    */
    connected: boolean // Whether the client is connected or not
    hidden: boolean // Whether the client is hidden or not
}

// Interface representing every message sent through websocket by the client
export interface WSMessage {
    action: WebsocketAction,
    payload: never
}

// Interface representing the payload sent by the client when it registers itself
export interface RegisterPayload {
    id: string,
    clientType: ClientType,
    dataType: {
        type: string,
        unit: string
        keys: string[]
    },
    hidden?: boolean
}

// Interface representing the payload sent by the client when it sends data
export interface DataPayload {
    data: Record<string,unknown> /* Data is stringified JSON of the form :
    {
        "maxStorage":100000,
        "currentStorage":2000
    }
    */
}

export interface ActionMessage {
    action: string,
    data?: Record<string,unknown>
}

// Enum representing different type of action the client through the websocket
export type WebsocketAction = 'register' | 'data'

// Enum representing different type of client
export type ClientType = 'time-based grapher' | 'instant grapher' | 'actuator'

// Interface representing the data-based data in the form in which it is stored in the database
export interface TimeData {
    id: number,
    source: string,
    time:string
    data: string
}

// Interface representing the instant data in the form in which it is stored in the database
export interface InstantData {
    id: number,
    source: string,
    data: string
}

// Interface representing the User in the form in which it is stored in the database
export interface User {
    id?: number,
    username: string,
    password: string
}

export interface Group {
    dbid?: number,
    id: string,
    members: string
}
