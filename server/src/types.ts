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
    rate:number,
}

export type ClientType = 'door' | 'energyLogger';


//----------------------------------------------------------------------\\
//----------------------------WEBSERVER---------------------------------\\
export interface TypedRequest<T> extends Request {
    body: T
}


//----------------------------------------------------------------------\\
//----------------------------DATABASE----------------------------------\\
export interface EnergyRead{
    id?:number,
    time:string,
    rate:number,
    source:string,
    type:EnergyReadType,
}

export type EnergyReadType = 'rate' | 'storage';


