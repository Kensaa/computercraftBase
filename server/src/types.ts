import { WebSocket } from 'ws'
import {Request} from 'express'

export interface WebsocketClient{
    id:number,
    ws:WebSocket,
}

// ---------------------------------------------------------------------- \\
// -------------------------------WEBSOCKET------------------------------ \\


export interface WSMessage{
    event:string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload:Record<string, any>,
} 

export interface RegisterPayload{
    type:ClientType,
    name:string,
}

export interface SubtypedRegisterPayload<T> extends RegisterPayload{
    subtype:T,
}
export interface StoragePayload{
    storage:number,
    maxStorage:number,
    data?:FluidData | ItemData
}

export interface RatePayload{
    rate:number,
}

export interface FluidData{
    name:string,
}

export interface ItemData{
    items:{
        slot:number,
        displayName:string,
        count:number,
        maxCount:number,
        name:string
    }[],
}

export type ClientType = 'door' | 'reactor' | 'storage' | 'rate'
export type StorageType = 'energy' | 'fluid'
export type RateType = 'energy'


// ---------------------------------------------------------------------- \\
// ----------------------------WEBSERVER--------------------------------- \\
export interface TypedRequest<T> extends Request {
    body: T
}


// ---------------------------------------------------------------------- \\
// ----------------------------DATABASE---------------------------------- \\


export interface Permissions {
    door:number,
    reactor:number,
    storage:number,
    rate:number,
}

export interface User{
    id:number,
    username:string,
    password:string,
    permissions:Permissions
}

export interface DatabaseClient{
    id:number,
    name:string,
    type:ClientType
}
export interface SubtypedClient<T> extends DatabaseClient{
    subtype:T
}

export interface Storage{
    id:number,
    time:string,
    storage:number,
    maxStorage:number,
    source:DatabaseClient['name'],
    type:StorageType,
    data?:string
}

export interface Rate{
    id:number,
    time:string,
    rate:number
    source:DatabaseClient['name'],
    type:RateType,
}