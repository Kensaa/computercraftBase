import { WebSocket } from "ws";
import {Request} from 'express'
export interface Client{
    ws:WebSocket,
    type:ClientType,
    name:string,
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
export interface EnergyRatePayload{
    inputRate:number,
    outputRate:number,
}

export interface EnergyStoragePayload{
    storage:number,
    maxStorage:number,
}

export type ClientType = 'door' | 'energyRateLogger' | 'energyStorageLogger';


//----------------------------------------------------------------------\\
//----------------------------WEBSERVER---------------------------------\\
export interface TypedRequest<T> extends Request {
    body: T
}


//----------------------------------------------------------------------\\
//----------------------------DATABASE----------------------------------\\
export interface EnergyRate{
    id?:number,
    time:string,
    inputRate:number,
    outputRate:number,
    source:string,
}

export interface EnergyStorage{
    id?:number,
    time:string,
    storage:number,
    maxStorage:number,
    source:string,

}


