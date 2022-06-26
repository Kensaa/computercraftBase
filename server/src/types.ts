import { WebSocket } from "ws";
import {Request} from 'express'

export interface WebsocketClient{
    id:number,
    ws:WebSocket,
}

//----------------------------------------------------------------------\\
//-------------------------------WEBSOCKET------------------------------\\


export interface WSMessage{
    event:string,
    payload:Object,
} 

export interface RegisterPayload{
    type:ClientType,
    name:string,
}

export interface SubtypedRegisterPayload<T> extends RegisterPayload{
    subtype:T,
}

export interface RegisterStoragePayload extends RegisterPayload{
    storageType:StorageType,
}
/*
export interface EnergyRatePayload{
    inputRate:number,
    outputRate:number,
}

*/
export interface StoragePayload{
    storage:number,
    maxStorage:number,
    //type:StorageType,
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


//----------------------------------------------------------------------\\
//----------------------------WEBSERVER---------------------------------\\
export interface TypedRequest<T> extends Request {
    body: T
}


//----------------------------------------------------------------------\\
//----------------------------DATABASE----------------------------------\\


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
    data?:string // ItemData to add
}

export interface Rate{
    id:number,
    time:string,
    rate:number
    source:DatabaseClient['name'],
    type:RateType,
}