import * as ws from 'ws'
import * as express from 'express'
import * as cors from 'cors'
import * as path from 'path'
import { Request,Response } from 'express'
import {Client,WSMessage,RegisterPayload,EnergyRatePayload,EnergyStoragePayload,EnergyRate,EnergyStorage} from './types'
import * as sql from './sql'

const SOCKETPORT = 3694;
const WEBSERVERPORT = SOCKETPORT+1;

(async ()=>{
    var clients:Client[] = []
    var database = await sql.loadDatabase('database.db')

    const wsServer = new ws.Server({ port: SOCKETPORT })
    console.log(`websocket server started on port ${SOCKETPORT}`)

    const expressServer = express()
    expressServer.use(express.json())
    expressServer.use(cors())
    expressServer.listen(WEBSERVERPORT,()=>console.log(`web server started on port ${WEBSERVERPORT}`))
    
    
    const awaitForResponse = (socket:ws.WebSocket)=> {
        return new Promise<string>((resolve,reject)=>{
            socket.once('response',resolve)
        })
    }
    
    wsServer.on('connection', ws => {
        ws.on('close',()=>{
            const client = clients.find(c=>c.ws===ws)
            if(client){
                console.log(`unregistering client with name "${client.name}" and type "${client.type}"`)
            }
            clients = clients.filter(e=>e.ws!==ws);
    
        })
        ws.on('message', (data) => {
            const message:WSMessage = JSON.parse(data.toString())
            if(message.event==='register'){
                const payload = message.payload as RegisterPayload
                if(clients.find(e=>e.name===payload.name && e.type===payload.type))return
                const client:Client = {...payload,ws}
                clients.push(client)
                console.log(`registered client with name "${client.name}" and type "${client.type}"`)
            }else if (message.event==='energyRate'){
                const payload = message.payload as EnergyRatePayload
                const client = clients.find(e=>e.ws===ws)
                if(client){
                    const energyRate:EnergyRate = {
                        time:new Date().getTime().toString(),
                        ...payload,
                        source:client.name
                    }
                    sql.addEnergyRate(database,energyRate)
                }
            }else if(message.event==='energyStorage'){
                const payload = message.payload as EnergyStoragePayload
                const client = clients.find(e=>e.ws===ws)
                if(client){
                    const energyStorage:EnergyStorage = {
                        time:new Date().getTime().toString(),
                        ...(payload),
                        source:client.name
                    }
                    sql.addEnergyStorage(database,energyStorage)
                }
            }
        })
    })
    
    
    expressServer.get('/api/door', async (req:Request,res:Response)=>{
        const doors = clients.filter(e=>e.type==='door')
        if(!doors)return res.sendStatus(404)
        res.send(doors.map(e=>e.name))
    })
    
    expressServer.post('/api/door' , async (req:Request,res:Response)=>{
        const validActions = ['open','close','enter']
        if(req.body.door === undefined || req.body.action === undefined){
            res.sendStatus(400)
            return
        }
        if(!validActions.includes(req.body.action)){
            res.sendStatus(400)
            return
        }
        const door = clients.filter(e=>e.type==='door' && e.name===req.body.door)[0]
        if(door){
            door.ws.send(req.body.action)
            res.sendStatus(200)
        }else{
            res.status(404).send('door not found')
        }
    })

    expressServer.get('/api/energy/rate', async (req:Request,res:Response)=>{
        const loggers = clients.filter(e=>e.type==='energyRateLogger').map(e=>e.name)
        res.send(loggers);
    })

    expressServer.get('/api/energy/rate/:name/:count', async (req:Request,res:Response)=>{
        const name = req.params.name

        var count = parseInt(req.params.count)
        if(isNaN(count) || count<1)count = 100
        const rates = await sql.getEnergyRatesBySource(database,name,count)
        if(rates.length === 0){
            res.sendStatus(404)
            return
        }
        res.send(rates)
    })

    expressServer.get('/api/energy/storage', async (req:Request,res:Response)=>{
        const loggers = clients.filter(e=>e.type==='energyStorageLogger').map(e=>e.name)
        res.send(loggers);
    })

    expressServer.get('/api/energy/storage/:name/:count', async (req:Request,res:Response)=>{
        const name = req.params.name

        var count = parseInt(req.params.count)
        if(isNaN(count) || count<1)count = 100
        const rates = await sql.getEnergyStoragesBySource(database,name,count)
        if(rates.length === 0){
            res.sendStatus(404)
            return
        }
        res.send(rates)
    })

    expressServer.use(express.static('public'))
    expressServer.get('*', (req: Request, res: Response) =>{
        res.sendFile(path.join(__dirname,'..','public','index.html'));
    });
})()